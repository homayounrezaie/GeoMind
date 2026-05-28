#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import os
import re
import threading
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont

try:
    from celery import Celery
except ImportError:  # Celery is only needed when running the async worker.
    Celery = None


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CSV_PATH = ROOT / "data" / "papers.csv"
THUMBNAIL_WIDTH = 600
THUMBNAIL_QUALITY = 85
PDFIUM_SCALE = 2
S3_CACHE_CONTROL = "public, max-age=31536000, immutable"
DEFAULT_USER_AGENT = "MyApp/1.0 (contact@email)"
ARXIV_MIN_INTERVAL_SECONDS = 1.0
THUMBNAIL_COLUMNS = ("thumbnail_url", "thumbnail_status")

_arxiv_lock = threading.Lock()
_last_arxiv_request_at = 0.0


class ThumbnailError(Exception):
    """Base exception for thumbnail generation failures."""


class NetworkFetchError(ThumbnailError):
    """Raised when a retried network fetch still fails."""


@dataclass(frozen=True)
class HttpResponse:
    body: bytes
    content_type: str
    url: str


class HttpClient:
    def __init__(
        self,
        user_agent: str | None = None,
        timeout: int = 45,
        max_retries: int = 3,
        backoff_seconds: float = 0.75,
    ) -> None:
        self.user_agent = user_agent or os.getenv("THUMBNAIL_USER_AGENT") or DEFAULT_USER_AGENT
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_seconds = backoff_seconds

    def fetch(self, url: str, *, accept: str = "*/*", arxiv: bool = False) -> HttpResponse:
        if arxiv:
            throttle_arxiv()

        last_error: BaseException | None = None
        for attempt in range(self.max_retries):
            request = Request(
                url,
                headers={
                    "User-Agent": self.user_agent,
                    "Accept": accept,
                },
            )
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    return HttpResponse(
                        body=response.read(),
                        content_type=response.headers.get("Content-Type", ""),
                        url=response.geturl(),
                    )
            except HTTPError as exc:
                if exc.code not in {408, 429} and exc.code < 500:
                    raise NetworkFetchError(f"HTTP {exc.code} for {url}") from exc
                last_error = exc
            except (OSError, TimeoutError, URLError) as exc:
                last_error = exc

            if attempt < self.max_retries - 1:
                time.sleep(self.backoff_seconds * (2**attempt))

        raise NetworkFetchError(f"Could not fetch {url}") from last_error


class CsvPaperStore:
    """CSV-backed paper row store used by this static repo.

    Production deployments can replace this with a DB adapter exposing the same
    get/update_thumbnail methods.
    """

    def __init__(self, path: Path | str | None = None) -> None:
        self.path = Path(path or os.getenv("THUMBNAIL_CSV_PATH") or DEFAULT_CSV_PATH)

    def get(self, paper_id: str) -> dict[str, str]:
        rows, _fieldnames = self._read()
        for row in rows:
            if row.get("id") == paper_id:
                return row
        raise KeyError(f"Paper not found: {paper_id}")

    def update_thumbnail(
        self,
        paper_id: str,
        *,
        thumbnail_url: str | None = None,
        thumbnail_status: str | None = None,
    ) -> None:
        rows, fieldnames = self._read()
        for column in THUMBNAIL_COLUMNS:
            if column not in fieldnames:
                fieldnames.append(column)

        changed = False
        for row in rows:
            if row.get("id") != paper_id:
                continue
            if thumbnail_url is not None:
                row["thumbnail_url"] = thumbnail_url
            if thumbnail_status is not None:
                row["thumbnail_status"] = thumbnail_status
            changed = True
            break

        if not changed:
            raise KeyError(f"Paper not found: {paper_id}")

        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

    def _read(self) -> tuple[list[dict[str, str]], list[str]]:
        with self.path.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            return list(reader), list(reader.fieldnames or [])


class S3Storage:
    def __init__(
        self,
        *,
        bucket: str | None = None,
        endpoint_url: str | None = None,
        region: str | None = None,
        public_base_url: str | None = None,
        prefix: str | None = None,
    ) -> None:
        bucket = bucket or os.getenv("S3_BUCKET")
        if not bucket:
            raise ThumbnailError("S3_BUCKET is required")

        import boto3
        from botocore.exceptions import ClientError

        self._client_error = ClientError
        self.bucket = bucket
        self.endpoint_url = endpoint_url or os.getenv("S3_ENDPOINT_URL")
        self.region = region or os.getenv("S3_REGION") or os.getenv("AWS_REGION") or "us-east-1"
        self.public_base_url = (public_base_url or os.getenv("S3_PUBLIC_BASE_URL") or "").rstrip("/")
        self.prefix = (prefix or os.getenv("S3_THUMBNAIL_PREFIX") or "thumbnails").strip("/")

        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id=os.getenv("S3_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

    def key_for(self, paper_id: str) -> str:
        return f"{self.prefix}/{safe_key_part(paper_id)}.webp"

    def exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except self._client_error as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise

    def public_url(self, key: str) -> str:
        quoted_key = quote(key, safe="/")
        if self.public_base_url:
            return f"{self.public_base_url}/{quoted_key}"
        if self.endpoint_url:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{quoted_key}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{quoted_key}"

    def upload(self, key: str, body: bytes) -> str:
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=body,
            ContentType="image/webp",
            CacheControl=S3_CACHE_CONTROL,
        )
        return self.public_url(key)


def generate_thumbnail(
    paper_id: str,
    *,
    store: Any | None = None,
    storage: Any | None = None,
    http: HttpClient | None = None,
) -> str:
    """Generate and upload a 600px WebP thumbnail for one paper."""

    store = store or CsvPaperStore()
    storage = storage or S3Storage()
    http = http or HttpClient()

    paper = store.get(paper_id)
    key = storage.key_for(paper_id)
    ready_url = clean(paper.get("thumbnail_url"))
    if clean(paper.get("thumbnail_status")) == "ready" and ready_url:
        return ready_url

    if storage.exists(key):
        public_url = storage.public_url(key)
        store.update_thumbnail(paper_id, thumbnail_url=public_url, thumbnail_status="ready")
        return public_url

    store.update_thumbnail(paper_id, thumbnail_status="pending")
    try:
        thumbnail = build_thumbnail(paper, http)
        public_url = storage.upload(key, thumbnail)
        store.update_thumbnail(paper_id, thumbnail_url=public_url, thumbnail_status="ready")
        return public_url
    except Exception:
        store.update_thumbnail(paper_id, thumbnail_status="failed")
        raise


def build_thumbnail(paper: Mapping[str, str], http: HttpClient) -> bytes:
    arxiv_id = normalize_arxiv_id(paper.get("arxiv_id"))
    pdf_url = clean(paper.get("pdf_url"))
    external = external_url(paper)

    if arxiv_id:
        try:
            return thumbnail_from_pdf_url(arxiv_pdf_url(arxiv_id), http, arxiv=True)
        except ThumbnailError:
            pass

    if pdf_url:
        try:
            return thumbnail_from_pdf_url(pdf_url, http, arxiv=is_arxiv_url(pdf_url))
        except ThumbnailError:
            pass

    if external:
        try:
            return thumbnail_from_external_url(external, http)
        except ThumbnailError:
            pass

    return fallback_card_webp(
        paper_id=clean(paper.get("id")) or clean(paper.get("openalex_id")) or clean(paper.get("title")),
        title=clean(paper.get("title")) or "Untitled paper",
        author=first_author(paper.get("authors")),
    )


def thumbnail_from_pdf_url(url: str, http: HttpClient, *, arxiv: bool = False) -> bytes:
    response = http.fetch(url, accept="application/pdf,*/*", arxiv=arxiv)
    return render_pdf_first_page_webp(response.body)


def render_pdf_first_page_webp(pdf_bytes: bytes) -> bytes:
    try:
        import pypdfium2 as pdfium
    except ImportError as exc:
        raise ThumbnailError("pypdfium2 is required for PDF thumbnails") from exc

    try:
        pdf = pdfium.PdfDocument(pdf_bytes)
        page = pdf[0]
        bitmap = page.render(scale=PDFIUM_SCALE)
        image = bitmap.to_pil()
        return encode_image_to_webp(image)
    except Exception as exc:
        raise ThumbnailError("Could not render first PDF page") from exc
    finally:
        for obj_name in ("bitmap", "page", "pdf"):
            obj = locals().get(obj_name)
            close = getattr(obj, "close", None)
            if close:
                close()


def thumbnail_from_external_url(url: str, http: HttpClient) -> bytes:
    response = http.fetch(url, accept="text/html,*/*")
    html = response.body.decode("utf-8", errors="replace")
    image_url = extract_social_image_url(html, response.url)
    if not image_url:
        raise ThumbnailError(f"No og:image or twitter:image found for {url}")

    image_response = http.fetch(image_url, accept="image/*,*/*")
    try:
        with Image.open(io.BytesIO(image_response.body)) as image:
            return encode_image_to_webp(image)
    except Exception as exc:
        raise ThumbnailError(f"Could not encode social image for {url}") from exc


class SocialImageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.image_url = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.image_url or tag.lower() != "meta":
            return
        values = {key.lower(): value or "" for key, value in attrs}
        name = (values.get("property") or values.get("name") or "").lower()
        if name in {"og:image", "og:image:url", "twitter:image", "twitter:image:src"}:
            self.image_url = clean(values.get("content"))


def extract_social_image_url(html: str, base_url: str) -> str:
    parser = SocialImageParser()
    parser.feed(html)
    return urljoin(base_url, parser.image_url) if parser.image_url else ""


def encode_image_to_webp(image: Image.Image) -> bytes:
    image = image.convert("RGB")
    if image.width != THUMBNAIL_WIDTH:
        height = max(1, round(image.height * (THUMBNAIL_WIDTH / image.width)))
        image = image.resize((THUMBNAIL_WIDTH, height), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    image.save(output, "WEBP", quality=THUMBNAIL_QUALITY, method=6)
    return output.getvalue()


def fallback_card_webp(*, paper_id: str, title: str, author: str) -> bytes:
    width = THUMBNAIL_WIDTH
    height = 840
    digest = hashlib.sha256(paper_id.encode("utf-8")).digest()
    color_a = tuple(34 + digest[i] % 112 for i in range(3))
    color_b = tuple(92 + digest[i + 3] % 126 for i in range(3))

    image = Image.new("RGB", (width, height))
    pixels = []
    for y in range(height):
        for x in range(width):
            t = (x * 0.45 + y) / (width * 0.45 + height)
            pixels.append(tuple(round(color_a[i] * (1 - t) + color_b[i] * t) for i in range(3)))
    image.putdata(pixels)

    draw = ImageDraw.Draw(image)
    title_font = load_font(38, bold=True)
    author_font = load_font(22)
    meta_font = load_font(14)

    margin = 48
    draw.rectangle((margin, margin, width - margin, height - margin), outline=(255, 255, 255), width=2)
    draw.text((margin + 28, margin + 32), "GEOMIND PAPER", fill=(255, 255, 255), font=meta_font)

    y = 220
    for line in wrap_text(draw, title, title_font, width - margin * 2 - 56, max_lines=7):
        draw.text((margin + 28, y), line, fill=(255, 255, 255), font=title_font)
        y += 48

    if author:
        draw.text((margin + 28, min(y + 42, height - 140)), author, fill=(235, 242, 255), font=author_font)

    output = io.BytesIO()
    image.save(output, "WEBP", quality=THUMBNAIL_QUALITY, method=6)
    return output.getvalue()


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int, max_lines: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    used_words = 0
    for word in words:
        candidate = f"{current} {word}".strip()
        if text_width(draw, candidate, font) <= max_width:
            current = candidate
            used_words += 1
            continue
        if current:
            lines.append(current)
        current = word
        used_words += 1
        if len(lines) >= max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if len(lines) == max_lines and used_words < len(words):
        lines[-1] = lines[-1].rstrip(".") + "..."
    return lines


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    left, _top, right, _bottom = draw.textbbox((0, 0), text, font=font)
    return right - left


def load_font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    names = (
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def throttle_arxiv() -> None:
    global _last_arxiv_request_at
    min_interval = float(os.getenv("ARXIV_MIN_INTERVAL_SECONDS", str(ARXIV_MIN_INTERVAL_SECONDS)))
    with _arxiv_lock:
        elapsed = time.monotonic() - _last_arxiv_request_at
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        _last_arxiv_request_at = time.monotonic()


def external_url(paper: Mapping[str, str]) -> str:
    for key in ("external_url", "project_url", "link", "url", "github_url", "huggingface_url", "code_url"):
        value = clean(paper.get(key))
        if value and not looks_like_pdf(value):
            return value
    return ""


def first_author(authors: str | None) -> str:
    if not authors:
        return ""
    return re.split(r";|,|\band\b", authors, maxsplit=1)[0].strip()


def clean(value: Any) -> str:
    return str(value or "").strip()


def normalize_arxiv_id(value: Any) -> str:
    value = clean(value)
    value = re.sub(r"^arxiv:\s*", "", value, flags=re.I)
    value = value.replace("https://arxiv.org/abs/", "").replace("https://arxiv.org/pdf/", "")
    return value.removesuffix(".pdf").strip()


def arxiv_pdf_url(arxiv_id: str) -> str:
    return f"https://arxiv.org/pdf/{arxiv_id}.pdf"


def is_arxiv_url(url: str) -> bool:
    return "arxiv.org/pdf/" in url.lower()


def looks_like_pdf(url: str) -> bool:
    return ".pdf" in url.lower() or "arxiv.org/pdf/" in url.lower()


def safe_key_part(value: str) -> str:
    raw = clean(value)
    safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", raw).strip("._")
    if safe:
        return safe
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def create_celery_app() -> Any | None:
    if Celery is None:
        return None
    return Celery(
        "geomind_thumbnail_worker",
        broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        backend=os.getenv("CELERY_RESULT_BACKEND"),
    )


celery_app = create_celery_app()

if celery_app:

    @celery_app.task(name="geomind.generate_thumbnail", queue="thumbnails")
    def generate_thumbnail_task(paper_id: str) -> str:
        return generate_thumbnail(paper_id)

else:
    generate_thumbnail_task = None


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate one paper thumbnail and upload it to S3/R2.")
    parser.add_argument("paper_id")
    args = parser.parse_args()
    print(generate_thumbnail(args.paper_id))


if __name__ == "__main__":
    main()
