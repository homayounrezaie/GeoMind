#!/usr/bin/env python3
import argparse
import csv
import json
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "papers.csv"
DEFAULT_OUT = ROOT / "public" / "paper-previews"
USER_AGENT = "GeoMind paper preview generator (https://github.com/homayounrezaie/GeoMind)"


def main():
    parser = argparse.ArgumentParser(description="Generate first-page screenshots for paper PDFs.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--ids", nargs="*", default=[])
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dpi", type=int, default=110)
    parser.add_argument("--max-width", type=int, default=420)
    args = parser.parse_args()

    rows = read_rows(args.csv)
    if args.ids:
        wanted = set(args.ids)
        rows = [row for row in rows if row.get("id") in wanted]
    else:
        rows = sorted(rows, key=paper_sort_value, reverse=True)
        if args.limit:
            rows = rows[:args.limit]

    args.out.mkdir(parents=True, exist_ok=True)
    made = 0
    skipped = 0
    failed = 0

    for row in rows:
        paper_id = safe_id(row.get("id"))
        pdf_url = (row.get("pdf_url") or "").strip()
        if not paper_id or not pdf_url:
            skipped += 1
            continue
        target = args.out / f"{paper_id}.webp"
        if target.exists() and not args.force:
            skipped += 1
            continue
        try:
            generate_preview(pdf_url, target, args.dpi, args.max_width)
            made += 1
            print(f"generated {paper_id}")
        except Exception as exc:
            failed += 1
            print(f"failed {paper_id}: {exc}")

    write_manifest(args.out)
    print(f"done generated={made} skipped={skipped} failed={failed}")


def read_rows(path):
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def paper_sort_value(row):
    year = number(row.get("year"))
    citations = number(row.get("citations") or row.get("citation_count"))
    return citations * 1000 + year * 8


def number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def safe_id(value):
    value = str(value or "").strip()
    return value if re.fullmatch(r"[A-Za-z0-9_.-]+", value) else ""


def generate_preview(pdf_url, target, dpi, max_width):
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        pdf_path = tmpdir / "paper.pdf"
        png_prefix = tmpdir / "page"
        png_path = tmpdir / "page.png"
        download(pdf_url, pdf_path)
        subprocess.run(
            ["pdftoppm", "-f", "1", "-l", "1", "-singlefile", "-png", "-r", str(dpi), str(pdf_path), str(png_prefix)],
            check=True,
            capture_output=True,
            timeout=60,
        )
        with Image.open(png_path) as image:
            image = image.convert("RGB")
            if image.width > max_width:
                height = round(image.height * (max_width / image.width))
                image = image.resize((max_width, height), Image.Resampling.LANCZOS)
            image.save(target, "WEBP", quality=78, method=6)


def download(url, target):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        target.write_bytes(response.read())


def write_manifest(out_dir):
    ids = sorted(path.stem for path in out_dir.glob("*.webp"))
    with (out_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(ids, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
