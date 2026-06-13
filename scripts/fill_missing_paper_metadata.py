#!/usr/bin/env python3
"""Fill missing paper abstracts and BibTeX entries in data/papers.json."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PAPERS = ROOT / "data" / "papers.json"
DEFAULT_REPORT = ROOT / "data" / "missing-paper-metadata-report.json"
USER_AGENT = "GeoMind metadata updater"
CROSSREF_API = "https://api.crossref.org/works"
OPENALEX_API = "https://api.openalex.org/works"
SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1/paper"
ARXIV_API = "https://export.arxiv.org/api/query"
DOI_PATTERN = re.compile(r"\b10\.\d{4,9}/[^\s\"'<>]+", re.IGNORECASE)
ARXIV_PATTERN = re.compile(
    r"(?:arxiv(?:\.org)?[:/ ]+(?:abs/|pdf/)?)"
    r"(?P<id>(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?:v\d+)?)",
    re.IGNORECASE,
)
BARE_ARXIV_PATTERN = re.compile(r"\b(?P<id>\d{4}\.\d{4,5})(?:v\d+)?\b", re.IGNORECASE)


class MetadataClient:
    def __init__(self, delay: float, retries: int) -> None:
        self.delay = max(delay, 0)
        self.retries = max(retries, 0)

    def get_bytes(self, url: str, headers: dict[str, str] | None = None) -> bytes | None:
        request_headers = {"User-Agent": USER_AGENT, **(headers or {})}
        request = Request(url, headers=request_headers)

        for attempt in range(self.retries + 1):
            if self.delay:
                time.sleep(self.delay)
            try:
                with urlopen(request, timeout=30) as response:
                    return response.read()
            except HTTPError as error:
                if error.code == 404:
                    return None
                if error.code in {403, 429, 500, 502, 503, 504} and attempt < self.retries:
                    wait = min(2**attempt, 8)
                    print(f"warning: HTTP {error.code} for {url}; retrying in {wait}s", file=sys.stderr)
                    time.sleep(wait)
                    continue
                print(f"warning: HTTP {error.code} for {url}", file=sys.stderr)
                return None
            except (TimeoutError, URLError) as error:
                if attempt < self.retries:
                    wait = min(2**attempt, 8)
                    print(f"warning: failed request for {url}: {error}; retrying in {wait}s", file=sys.stderr)
                    time.sleep(wait)
                    continue
                print(f"warning: failed request for {url}: {error}", file=sys.stderr)
                return None

        return None

    def get_json(self, url: str, headers: dict[str, str] | None = None) -> dict[str, Any] | None:
        payload = self.get_bytes(url, {"Accept": "application/json", **(headers or {})})
        if not payload:
            return None
        try:
            return json.loads(payload.decode("utf-8"))
        except json.JSONDecodeError as error:
            print(f"warning: failed JSON decode for {url}: {error}", file=sys.stderr)
            return None

    def get_text(self, url: str, headers: dict[str, str] | None = None) -> str | None:
        payload = self.get_bytes(url, headers)
        if not payload:
            return None
        return payload.decode("utf-8", "ignore")

    def doi_bibtex(self, doi: str) -> str | None:
        text = self.get_text(
            f"https://doi.org/{quote(doi, safe='/')}",
            {"Accept": "application/x-bibtex"},
        )
        return clean_bibtex(text)

    def crossref_by_doi(self, doi: str) -> dict[str, Any] | None:
        payload = self.get_json(f"{CROSSREF_API}/{quote(doi, safe='')}")
        if payload and isinstance(payload.get("message"), dict):
            return payload["message"]
        return None

    def crossref_by_title(self, title: str, year: int | None) -> dict[str, Any] | None:
        params = {
            "query.title": title,
            "rows": "5",
            "select": "DOI,title,author,container-title,published-print,published-online,issued,type,abstract,page",
        }
        payload = self.get_json(f"{CROSSREF_API}?{urlencode(params)}")
        if not payload:
            return None
        items = payload.get("message", {}).get("items", [])
        return best_title_match(title, year, items)

    def openalex_by_doi(self, doi: str) -> dict[str, Any] | None:
        params = {"select": "id,display_name,abstract_inverted_index,publication_year,doi,authorships,primary_location"}
        return self.get_json(f"{OPENALEX_API}/doi:{quote(doi, safe='')}?{urlencode(params)}")

    def openalex_by_title(self, title: str, year: int | None) -> dict[str, Any] | None:
        title_query = normalize_title(title)
        if not title_query:
            return None
        params = {
            "filter": f"title.search:{title_query}",
            "per-page": "5",
            "select": "id,display_name,abstract_inverted_index,publication_year,doi,authorships,primary_location",
        }
        payload = self.get_json(f"{OPENALEX_API}?{urlencode(params)}")
        if not payload:
            return None
        return best_title_match(title, year, payload.get("results", []), title_key="display_name")

    def semantic_scholar_by_doi(self, doi: str) -> dict[str, Any] | None:
        params = urlencode({"fields": "title,abstract,year,authors,externalIds,venue"})
        return self.get_json(f"{SEMANTIC_SCHOLAR_API}/DOI:{quote(doi, safe='')}?{params}")

    def semantic_scholar_by_arxiv(self, arxiv_id: str) -> dict[str, Any] | None:
        params = urlencode({"fields": "title,abstract,year,authors,externalIds,venue"})
        return self.get_json(f"{SEMANTIC_SCHOLAR_API}/arXiv:{quote(strip_arxiv_version(arxiv_id), safe='')}?{params}")

    def semantic_scholar_by_title(self, title: str, year: int | None) -> dict[str, Any] | None:
        params = urlencode({"query": title, "limit": "5", "fields": "title,abstract,year,authors,externalIds,venue"})
        payload = self.get_json(f"{SEMANTIC_SCHOLAR_API}/search?{params}")
        if not payload:
            return None
        return best_title_match(title, year, payload.get("data", []))

    def arxiv_metadata(self, arxiv_id: str) -> dict[str, Any] | None:
        params = urlencode({"id_list": strip_arxiv_version(arxiv_id)})
        text = self.get_text(f"{ARXIV_API}?{params}", {"Accept": "application/atom+xml"})
        if not text:
            return None
        try:
            root = ET.fromstring(text)
        except ET.ParseError:
            return None
        ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
        entry = root.find("atom:entry", ns)
        if entry is None:
            return None
        authors = [
            (author.findtext("atom:name", default="", namespaces=ns) or "").strip()
            for author in entry.findall("atom:author", ns)
        ]
        primary_category = entry.find("arxiv:primary_category", ns)
        return {
            "id": entry.findtext("atom:id", default="", namespaces=ns),
            "title": entry.findtext("atom:title", default="", namespaces=ns),
            "summary": entry.findtext("atom:summary", default="", namespaces=ns),
            "published": entry.findtext("atom:published", default="", namespaces=ns),
            "authors": [author for author in authors if author],
            "primary_category": primary_category.get("term") if primary_category is not None else None,
        }


def best_title_match(
    title: str,
    year: int | None,
    candidates: list[Any],
    title_key: str = "title",
) -> dict[str, Any] | None:
    expected = normalize_title(title)
    best: tuple[float, dict[str, Any]] | None = None
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        candidate_title = candidate.get(title_key)
        if isinstance(candidate_title, list):
            candidate_title = candidate_title[0] if candidate_title else ""
        candidate_text = normalize_title(str(candidate_title or ""))
        if not candidate_text:
            continue
        score = SequenceMatcher(None, expected, candidate_text).ratio()
        candidate_year = extract_year(candidate)
        if year and candidate_year and abs(candidate_year - year) > 1:
            score -= 0.08
        if expected == candidate_text:
            score = 1.0
        if best is None or score > best[0]:
            best = (score, candidate)
    if not best or best[0] < 0.9:
        return None
    return best[1]


def extract_year(payload: dict[str, Any]) -> int | None:
    value = payload.get("year") or payload.get("publication_year")
    if isinstance(value, int):
        return value
    for key in ("published-print", "published-online", "issued"):
        parts = payload.get(key, {}).get("date-parts")
        if parts and isinstance(parts, list) and parts[0]:
            try:
                return int(parts[0][0])
            except (TypeError, ValueError):
                pass
    return None


def abstract_from_crossref(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    abstract = payload.get("abstract")
    if not isinstance(abstract, str):
        return None
    return clean_abstract(strip_tags(abstract))


def abstract_from_openalex(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    inverted = payload.get("abstract_inverted_index")
    if not isinstance(inverted, dict):
        return None
    positions: dict[int, str] = {}
    for word, indexes in inverted.items():
        if not isinstance(word, str) or not isinstance(indexes, list):
            continue
        for index in indexes:
            if isinstance(index, int):
                positions[index] = word
    if not positions:
        return None
    return clean_abstract(" ".join(positions[index] for index in sorted(positions)))


def abstract_from_semantic_scholar(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    abstract = payload.get("abstract")
    return clean_abstract(abstract) if isinstance(abstract, str) else None


def abstract_from_arxiv(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    summary = payload.get("summary")
    return clean_abstract(summary) if isinstance(summary, str) else None


def doi_from_crossref(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    doi = payload.get("DOI")
    return clean_doi(doi) if isinstance(doi, str) else None


def doi_from_openalex(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    doi = payload.get("doi")
    if not isinstance(doi, str):
        return None
    parsed = urlparse(doi)
    if parsed.netloc:
        return clean_doi(parsed.path.lstrip("/"))
    return clean_doi(doi)


def doi_from_semantic_scholar(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    external = payload.get("externalIds")
    if isinstance(external, dict) and isinstance(external.get("DOI"), str):
        return clean_doi(external["DOI"])
    return None


def generated_bibtex(paper: dict[str, Any], arxiv_payload: dict[str, Any] | None = None) -> str:
    title = str(paper.get("title") or "").strip()
    year = as_int(paper.get("year")) or extract_year(arxiv_payload or {}) or datetime.now().year
    authors = extract_authors(paper, arxiv_payload)
    key = bibtex_key(authors, year, title)
    fields = {
        "title": title,
        "author": " and ".join(authors) if authors else str(paper.get("authors") or "").replace(", ", " and "),
        "year": str(year),
    }
    venue = str(paper.get("venue") or "").strip()
    if venue:
        fields["booktitle" if venue.upper() in {"CVPR", "ICCV", "ECCV", "WACV", "ACCV"} else "journal"] = venue
    arxiv_id = find_arxiv_id(paper)
    if arxiv_id:
        fields["eprint"] = strip_arxiv_version(arxiv_id)
        fields["archivePrefix"] = "arXiv"
        fields["primaryClass"] = str((arxiv_payload or {}).get("primary_category") or "").strip()
    url = first_link(paper, ("paper", "arxiv", "pdf", "project_page"))
    if url:
        fields["url"] = url
    lines = [f"@misc{{{key},"]
    for field, value in fields.items():
        value = str(value).strip()
        if value:
            lines.append(f"  {field} = {{{escape_bibtex(value)}}},")
    lines.append("}")
    return "\n".join(lines)


def extract_authors(paper: dict[str, Any], arxiv_payload: dict[str, Any] | None) -> list[str]:
    if arxiv_payload and isinstance(arxiv_payload.get("authors"), list):
        authors = [str(author).strip() for author in arxiv_payload["authors"] if str(author).strip()]
        if authors:
            return authors
    authors = paper.get("authors")
    if isinstance(authors, str):
        return [author.strip() for author in re.split(r"\s*,\s*|\s+;\s+", authors) if author.strip()]
    return []


def bibtex_key(authors: list[str], year: int, title: str) -> str:
    first_author = "paper"
    if authors:
        first_author = re.sub(r"[^A-Za-z0-9]+", "", authors[0].split()[-1]) or "paper"
    first_word = re.sub(r"[^A-Za-z0-9]+", "", title.split()[0]) if title.split() else "paper"
    return f"{first_author}_{year}_{first_word}"


def escape_bibtex(value: str) -> str:
    return value.replace("\\", "\\textbackslash{}").replace("{", "\\{").replace("}", "\\}")


def first_link(paper: dict[str, Any], keys: tuple[str, ...]) -> str | None:
    links = paper.get("links") if isinstance(paper.get("links"), dict) else {}
    for key in keys:
        value = links.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def strip_tags(value: str) -> str:
    return re.sub(r"<[^>]+>", " ", value)


def clean_abstract(value: str | None) -> str | None:
    if not value:
        return None
    text = html.unescape(value)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^(abstract|summary)\s*[:.-]\s*", "", text, flags=re.IGNORECASE)
    return text or None


def clean_bibtex(value: str | None) -> str | None:
    if not value:
        return None
    text = html.unescape(value).strip()
    text = re.sub(r"\r\n?", "\n", text)
    return text if text.startswith("@") else None


def clean_doi(doi: str) -> str:
    doi = doi.strip().rstrip(".,);]")
    doi = doi.removeprefix("doi:")
    doi = doi.removeprefix("DOI:")
    return doi


def normalize_title(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def as_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def strip_arxiv_version(arxiv_id: str) -> str:
    return re.sub(r"v\d+$", "", arxiv_id.strip(), flags=re.IGNORECASE)


def extract_doi_from_value(value: str) -> str | None:
    parsed = urlparse(value if "://" in value else f"https://{value}")
    if parsed.netloc.lower() in {"doi.org", "www.doi.org", "dx.doi.org"}:
        doi = clean_doi(parsed.path.lstrip("/"))
        return doi or None
    match = DOI_PATTERN.search(value)
    if match:
        return clean_doi(match.group(0))
    return None


def extract_arxiv_id_from_value(value: str) -> str | None:
    parsed = urlparse(value if "://" in value else f"https://{value}")
    if parsed.netloc.lower().endswith("arxiv.org"):
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 2 and parts[0] in {"abs", "pdf"}:
            return strip_arxiv_version(parts[1].removesuffix(".pdf"))
    match = ARXIV_PATTERN.search(value)
    if match:
        return strip_arxiv_version(match.group("id"))
    if "arxiv" in value.lower():
        match = BARE_ARXIV_PATTERN.search(value)
        if match:
            return strip_arxiv_version(match.group("id"))
    return None


def find_doi(paper: dict[str, Any]) -> str | None:
    links = paper.get("links") if isinstance(paper.get("links"), dict) else {}
    for key in ("paper", "arxiv", "pdf", "project_page"):
        value = links.get(key)
        if isinstance(value, str):
            doi = extract_doi_from_value(value)
            if doi:
                return doi
    for value in links.values():
        if isinstance(value, str):
            doi = extract_doi_from_value(value)
            if doi:
                return doi
    return None


def find_arxiv_id(paper: dict[str, Any]) -> str | None:
    links = paper.get("links") if isinstance(paper.get("links"), dict) else {}
    for key in ("arxiv", "pdf", "paper", "project_page"):
        value = links.get(key)
        if isinstance(value, str):
            arxiv_id = extract_arxiv_id_from_value(value)
            if arxiv_id:
                return arxiv_id
    for value in links.values():
        if isinstance(value, str):
            arxiv_id = extract_arxiv_id_from_value(value)
            if arxiv_id:
                return arxiv_id
    return None


def fill_paper(client: MetadataClient, paper: dict[str, Any]) -> dict[str, Any]:
    missing_abstract = not isinstance(paper.get("abstract"), str) or not paper["abstract"].strip()
    missing_bibtex = not isinstance(paper.get("bibtex"), str) or not paper["bibtex"].strip()
    if not missing_abstract and not missing_bibtex:
        return {"abstract": False, "bibtex": False, "source": []}

    title = str(paper.get("title") or "").strip()
    year = as_int(paper.get("year"))
    doi = find_doi(paper)
    arxiv_id = find_arxiv_id(paper)
    sources: list[str] = []
    arxiv_payload = client.arxiv_metadata(arxiv_id) if arxiv_id else None
    if arxiv_payload:
        sources.append("arxiv")

    crossref = client.crossref_by_doi(doi) if doi else None
    if crossref:
        sources.append("crossref-doi")
    openalex = client.openalex_by_doi(doi) if doi else None
    if openalex:
        sources.append("openalex-doi")
    semantic = client.semantic_scholar_by_doi(doi) if doi else None
    if semantic:
        sources.append("semantic-scholar-doi")

    if not doi and title:
        crossref = client.crossref_by_title(title, year)
        doi = doi_from_crossref(crossref)
        if crossref:
            sources.append("crossref-title")
        openalex = client.openalex_by_title(title, year)
        doi = doi or doi_from_openalex(openalex)
        if openalex:
            sources.append("openalex-title")
        semantic = client.semantic_scholar_by_title(title, year)
        doi = doi or doi_from_semantic_scholar(semantic)
        if semantic:
            sources.append("semantic-scholar-title")

    if missing_abstract:
        abstract = (
            abstract_from_arxiv(arxiv_payload)
            or abstract_from_crossref(crossref)
            or abstract_from_openalex(openalex)
            or abstract_from_semantic_scholar(semantic)
        )
        if abstract:
            paper["abstract"] = abstract

    if missing_bibtex:
        bibtex = client.doi_bibtex(doi) if doi else None
        if not bibtex and arxiv_payload:
            bibtex = generated_bibtex(paper, arxiv_payload)
        if not bibtex and title:
            bibtex = generated_bibtex(paper, None)
        if bibtex:
            paper["bibtex"] = bibtex

    return {
        "abstract": missing_abstract and isinstance(paper.get("abstract"), str) and bool(paper["abstract"].strip()),
        "bibtex": missing_bibtex and isinstance(paper.get("bibtex"), str) and bool(paper["bibtex"].strip()),
        "source": sources,
    }


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--papers", type=Path, default=DEFAULT_PAPERS)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--delay", type=float, default=0.2)
    parser.add_argument("--retries", type=int, default=1)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()
    payload = json.loads(args.papers.read_text())
    papers = payload.get("papers", [])
    client = MetadataClient(delay=args.delay, retries=args.retries)

    before = []
    updates = []
    processed = 0
    for paper in papers:
        missing_abstract = not isinstance(paper.get("abstract"), str) or not paper["abstract"].strip()
        missing_bibtex = not isinstance(paper.get("bibtex"), str) or not paper["bibtex"].strip()
        if not missing_abstract and not missing_bibtex:
            continue
        if args.limit and processed >= args.limit:
            break
        processed += 1
        before.append(
            {
                "id": paper.get("id"),
                "title": paper.get("title"),
                "venue": paper.get("venue"),
                "year": paper.get("year"),
                "missing_abstract": missing_abstract,
                "missing_bibtex": missing_bibtex,
            }
        )
        result = fill_paper(client, paper)
        if result["abstract"] or result["bibtex"]:
            updates.append({"id": paper.get("id"), **result})
            print(
                f"{paper.get('id')}: abstract={result['abstract']} "
                f"bibtex={result['bibtex']} sources={','.join(result['source'])}"
            )

    unresolved = []
    for paper in papers:
        missing_abstract = not isinstance(paper.get("abstract"), str) or not paper["abstract"].strip()
        missing_bibtex = not isinstance(paper.get("bibtex"), str) or not paper["bibtex"].strip()
        if missing_abstract or missing_bibtex:
            unresolved.append(
                {
                    "id": paper.get("id"),
                    "title": paper.get("title"),
                    "venue": paper.get("venue"),
                    "year": paper.get("year"),
                    "missing_abstract": missing_abstract,
                    "missing_bibtex": missing_bibtex,
                    "links": paper.get("links"),
                }
            )

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "processed": processed,
        "initial_missing": before,
        "updates": updates,
        "unresolved": unresolved,
    }

    print(
        f"processed={processed} updates={len(updates)} "
        f"unresolved_abstracts={sum(item['missing_abstract'] for item in unresolved)} "
        f"unresolved_bibtex={sum(item['missing_bibtex'] for item in unresolved)}"
    )

    if not args.dry_run:
        args.papers.write_text(json.dumps(payload, indent=2) + "\n")
        args.report.write_text(json.dumps(report, indent=2) + "\n")
        print(f"wrote {args.papers}")
        print(f"wrote {args.report}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
