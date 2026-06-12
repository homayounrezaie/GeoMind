#!/usr/bin/env python3
"""Update citation and GitHub star counts in data/papers.json.

Citation source order:
1. OpenAlex by DOI, including generated arXiv DOIs such as 10.48550/arXiv.2501.12345.
2. Semantic Scholar by arXiv ID, only when S2_API_KEY is configured.

GitHub stars come from the GitHub repository REST API.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PAPERS = ROOT / "data" / "papers.json"
OPENALEX_API = "https://api.openalex.org/works"
GITHUB_API = "https://api.github.com/repos"
SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1/paper"
USER_AGENT = "GeoMind paper metrics updater"
GITHUB_LINK_KEYS = (
    "code",
    "model",
    "checkpoints",
    "dataset",
    "benchmark",
    "project_page",
    "paperswithcode",
    "paper",
)
DOI_PATTERN = re.compile(r"\b10\.\d{4,9}/[^\s\"'<>]+", re.IGNORECASE)
ARXIV_PATTERN = re.compile(
    r"(?:arxiv(?:\.org)?[:/ ]+(?:abs/|pdf/)?)?"
    r"(?P<id>(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?:v\d+)?)",
    re.IGNORECASE,
)


class MetricsClient:
    def __init__(self, delay: float = 0.05) -> None:
        self.delay = max(delay, 0)
        self.github_token = os.getenv("GH_METRICS_TOKEN", "").strip() or os.getenv("GITHUB_TOKEN", "").strip()
        self.openalex_api_key = os.getenv("OPENALEX_API_KEY", "").strip()
        self.openalex_mailto = os.getenv("OPENALEX_MAILTO", "").strip()
        self.semantic_scholar_key = os.getenv("S2_API_KEY", "").strip()

    def get_json(self, url: str, headers: dict[str, str] | None = None) -> dict[str, Any] | None:
        request_headers = {
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
            **(headers or {}),
        }
        request = Request(url, headers=request_headers)

        if self.delay:
            time.sleep(self.delay)

        try:
            with urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code == 404:
                return None
            if error.code in {403, 429}:
                print(f"warning: {error.code} for {url}", file=sys.stderr)
                return None
            print(f"warning: HTTP {error.code} for {url}", file=sys.stderr)
            return None
        except (URLError, TimeoutError, json.JSONDecodeError) as error:
            print(f"warning: failed request for {url}: {error}", file=sys.stderr)
            return None

    def github_stars(self, repo: str) -> int | None:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        if self.github_token:
            headers["Authorization"] = f"Bearer {self.github_token}"

        payload = self.get_json(f"{GITHUB_API}/{quote(repo, safe='/')}", headers)
        if not payload:
            return None

        return as_count(payload.get("stargazers_count"))

    def openalex_citations(self, doi: str) -> int | None:
        params = {"select": "id,cited_by_count"}

        if self.openalex_api_key:
            params["api_key"] = self.openalex_api_key
        if self.openalex_mailto:
            params["mailto"] = self.openalex_mailto

        url = f"{OPENALEX_API}/doi:{quote(doi, safe='')}?{urlencode(params)}"
        payload = self.get_json(url)
        if not payload:
            return None

        return as_count(payload.get("cited_by_count"))

    def semantic_scholar_citations(self, arxiv_id: str) -> int | None:
        if not self.semantic_scholar_key:
            return None

        headers = {"x-api-key": self.semantic_scholar_key}
        params = urlencode({"fields": "citationCount"})
        url = f"{SEMANTIC_SCHOLAR_API}/arXiv:{quote(strip_arxiv_version(arxiv_id), safe='')}?{params}"
        payload = self.get_json(url, headers)
        if not payload:
            return None

        return as_count(payload.get("citationCount"))


def as_count(value: Any) -> int | None:
    try:
        count = int(value)
    except (TypeError, ValueError):
        return None

    if count < 0:
        return None

    return count


def strip_arxiv_version(arxiv_id: str) -> str:
    return re.sub(r"v\d+$", "", arxiv_id.strip(), flags=re.IGNORECASE)


def clean_doi(doi: str) -> str:
    doi = doi.strip().rstrip(".,);]")
    doi = doi.removeprefix("doi:")
    doi = doi.removeprefix("DOI:")
    return doi


def get_link_values(paper: dict[str, Any]) -> dict[str, str]:
    links = paper.get("links") if isinstance(paper.get("links"), dict) else {}
    values: dict[str, str] = {}

    for key, value in links.items():
        if isinstance(value, str) and value.strip():
            values[key] = value.strip()

    return values


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

    return None


def find_doi(paper: dict[str, Any]) -> str | None:
    links = get_link_values(paper)

    for key in ("paper", "arxiv", "pdf", "project_page"):
        value = links.get(key)
        if value:
            doi = extract_doi_from_value(value)
            if doi:
                return doi

    for value in links.values():
        doi = extract_doi_from_value(value)
        if doi:
            return doi

    return None


def find_arxiv_id(paper: dict[str, Any]) -> str | None:
    links = get_link_values(paper)

    for key in ("arxiv", "pdf", "paper", "project_page"):
        value = links.get(key)
        if value:
            arxiv_id = extract_arxiv_id_from_value(value)
            if arxiv_id:
                return arxiv_id

    for value in links.values():
        arxiv_id = extract_arxiv_id_from_value(value)
        if arxiv_id:
            return arxiv_id

    return None


def normalize_github_url(value: str) -> str | None:
    candidate = value.strip()
    if candidate.startswith("git@github.com:"):
        path = candidate.removeprefix("git@github.com:").removesuffix(".git")
        parts = path.split("/")
    else:
        if candidate.startswith("github.com/"):
            candidate = f"https://{candidate}"
        parsed = urlparse(candidate)
        if parsed.netloc.lower() not in {"github.com", "www.github.com"}:
            return None
        parts = [part for part in parsed.path.split("/") if part]

    if len(parts) < 2:
        return None

    owner, repo = parts[0], parts[1].removesuffix(".git")
    if owner.lower() in {"features", "marketplace", "topics", "collections", "orgs"}:
        return None
    if not owner or not repo:
        return None

    return f"{owner}/{repo}"


def find_github_repo(paper: dict[str, Any]) -> str | None:
    links = get_link_values(paper)

    for key in GITHUB_LINK_KEYS:
        value = links.get(key)
        if value:
            repo = normalize_github_url(value)
            if repo:
                return repo

    for value in links.values():
        repo = normalize_github_url(value)
        if repo:
            return repo

    return None


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--papers", type=Path, default=DEFAULT_PAPERS, help="Path to papers.json.")
    parser.add_argument("--limit", type=int, default=0, help="Limit processed papers, useful for tests.")
    parser.add_argument("--ids", nargs="*", default=[], help="Only process these paper ids.")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing papers.json.")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay in seconds before each API request.")
    parser.add_argument("--citations-only", action="store_true", help="Only update citation counts.")
    parser.add_argument("--github-only", action="store_true", help="Only update GitHub star counts.")
    return parser


def update_metrics(args: argparse.Namespace) -> int:
    payload = json.loads(args.papers.read_text())
    papers = payload.get("papers", [])
    selected_ids = set(args.ids)
    client = MetricsClient(delay=args.delay)
    github_cache: dict[str, int | None] = {}
    citation_cache: dict[str, int | None] = {}
    processed = 0
    changed = 0
    citation_updates = 0
    star_updates = 0

    for paper in papers:
        paper_id = str(paper.get("id") or "")
        if selected_ids and paper_id not in selected_ids:
            continue
        if args.limit and processed >= args.limit:
            break

        processed += 1
        old_citations = as_count(paper.get("citations")) or 0
        old_stars = as_count(paper.get("github_stars")) or 0
        new_citations = None
        new_stars = None

        if not args.github_only:
            doi = find_doi(paper)
            arxiv_id = find_arxiv_id(paper)
            citation_keys = []
            if doi:
                citation_keys.append(("doi", doi))
            if arxiv_id:
                citation_keys.append(("arxiv-doi", f"10.48550/arXiv.{strip_arxiv_version(arxiv_id)}"))
                citation_keys.append(("s2-arxiv", arxiv_id))

            for key_type, key_value in citation_keys:
                cache_key = f"{key_type}:{key_value}"
                if cache_key not in citation_cache:
                    if key_type in {"doi", "arxiv-doi"}:
                        citation_cache[cache_key] = client.openalex_citations(key_value)
                    else:
                        citation_cache[cache_key] = client.semantic_scholar_citations(key_value)
                if citation_cache[cache_key] is not None:
                    new_citations = citation_cache[cache_key]
                    break

            if new_citations is not None and new_citations != old_citations:
                paper["citations"] = new_citations
                citation_updates += 1

        if not args.citations_only:
            repo = find_github_repo(paper)
            if repo:
                if repo not in github_cache:
                    github_cache[repo] = client.github_stars(repo)
                new_stars = github_cache[repo]

            if new_stars is not None and new_stars != old_stars:
                paper["github_stars"] = new_stars
                star_updates += 1

        if paper.get("citations") != old_citations or paper.get("github_stars") != old_stars:
            changed += 1
            print(
                f"{paper_id}: citations {old_citations}->{paper.get('citations', old_citations)}, "
                f"github_stars {old_stars}->{paper.get('github_stars', old_stars)}"
            )

    print(
        f"processed={processed} changed={changed} "
        f"citation_updates={citation_updates} star_updates={star_updates}"
    )

    if changed and not args.dry_run:
        args.papers.write_text(json.dumps(payload, indent=2) + "\n")
        timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
        print(f"wrote {args.papers} at {timestamp}")

    return changed


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    if args.citations_only and args.github_only:
        parser.error("--citations-only and --github-only cannot be used together")

    update_metrics(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
