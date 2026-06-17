#!/usr/bin/env python3
"""Update paper citation and GitHub star metrics.

The updater intentionally uses only strong identifiers for citation lookups:
explicit DOI values and arXiv IDs mapped to their 10.48550/arXiv DOI form.
Title-only search is avoided because it can match unrelated papers.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


DOI_RE = re.compile(r"\b10\.\d{4,9}/[^\s\"'{}<>]+", re.IGNORECASE)
ARXIV_RE = re.compile(r"arxiv\.org/(?:abs|pdf)/([0-9]{4}\.[0-9]{4,5})(?:v\d+)?", re.IGNORECASE)
GITHUB_RE = re.compile(r"github\.com[:/]([^/\s]+)/([^/\s#?]+)", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--papers", default="data/papers.json")
    parser.add_argument("--delay", type=float, default=0.25)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--rate-limit-wait", type=float, default=60)
    parser.add_argument("--max-retry-wait", type=float, default=180)
    parser.add_argument("--timeout", type=float, default=15)
    parser.add_argument("--only-missing-citations", action="store_true")
    parser.add_argument("--progress-every", type=int, default=100)
    parser.add_argument(
        "--github-limit",
        type=int,
        default=None,
        help="Maximum GitHub repo API requests when no token is available. Default: 0 without a token, unlimited with a token.",
    )
    return parser.parse_args()


def clean_doi(value: str) -> str:
    return value.rstrip(".,);]")


def extract_doi(paper: dict) -> str | None:
    fields = []
    links = paper.get("links") or {}
    fields.extend(str(value) for value in links.values() if value)
    if paper.get("bibtex"):
      fields.append(str(paper["bibtex"]))

    for text in fields:
        match = DOI_RE.search(text)
        if match:
            return clean_doi(match.group(0))
    return None


def extract_arxiv_id(paper: dict) -> str | None:
    links = paper.get("links") or {}
    for value in links.values():
        if not value:
            continue
        match = ARXIV_RE.search(str(value))
        if match:
            return match.group(1)
    return None


def extract_github_repo(url: str | None) -> tuple[str, str] | None:
    if not url:
        return None
    match = GITHUB_RE.search(url)
    if not match:
        return None
    owner = match.group(1)
    repo = match.group(2).removesuffix(".git")
    if owner.lower() in {"topics", "marketplace", "features"}:
        return None
    return owner, repo


def request_json(url: str, headers: dict[str, str], args: argparse.Namespace) -> dict | None:
    last_error: Exception | None = None
    for attempt in range(args.retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=args.timeout) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            last_error = error
            if error.code in {403, 429}:
                wait = min(args.rate_limit_wait, args.max_retry_wait)
            else:
                wait = min(2 ** attempt, args.max_retry_wait)
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            wait = min(2 ** attempt, args.max_retry_wait)

        if attempt < args.retries:
            time.sleep(wait)

    print(f"warning: request failed: {url}: {last_error}", file=sys.stderr)
    return None


def openalex_headers() -> dict[str, str]:
    headers = {"User-Agent": "GeoMind metrics updater"}
    mailto = os.getenv("OPENALEX_MAILTO")
    if mailto:
        headers["User-Agent"] = f"GeoMind metrics updater ({mailto})"
    return headers


def fetch_openalex_citations(doi: str, args: argparse.Namespace) -> int | None:
    encoded = urllib.parse.quote(f"https://doi.org/{doi}", safe="")
    url = f"https://api.openalex.org/works/{encoded}"
    data = request_json(url, openalex_headers(), args)
    if not data:
        return None
    count = data.get("cited_by_count")
    return count if isinstance(count, int) and count >= 0 else None


def github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GeoMind metrics updater",
    }
    token = os.getenv("GH_METRICS_TOKEN") or os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_github_stars(owner: str, repo: str, args: argparse.Namespace) -> int | None:
    owner_q = urllib.parse.quote(owner, safe="")
    repo_q = urllib.parse.quote(repo, safe="")
    url = f"https://api.github.com/repos/{owner_q}/{repo_q}"
    data = request_json(url, github_headers(), args)
    if not data:
        return None
    count = data.get("stargazers_count")
    return count if isinstance(count, int) and count >= 0 else None


def main() -> int:
    args = parse_args()
    path = Path(args.papers)
    root = json.loads(path.read_text(encoding="utf-8"))
    papers = root.get("papers") if isinstance(root, dict) else root
    if not isinstance(papers, list):
        raise SystemExit("papers file must contain a list or a top-level 'papers' list")

    citation_cache: dict[str, int | None] = {}
    github_cache: dict[tuple[str, str], int | None] = {}
    github_token = bool(os.getenv("GH_METRICS_TOKEN") or os.getenv("GITHUB_TOKEN"))
    github_limit = args.github_limit
    if github_limit is None:
        github_limit = None if github_token else 0

    citation_updates = 0
    citation_lookups = 0
    github_updates = 0
    github_lookups = 0
    github_skipped_no_token = 0

    total = len(papers)
    for index, paper in enumerate(papers, start=1):
        if args.progress_every and index % args.progress_every == 0:
            print(f"Processed {index}/{total} papers...", flush=True)

        doi = extract_doi(paper)
        if not doi:
            arxiv_id = extract_arxiv_id(paper)
            doi = f"10.48550/arXiv.{arxiv_id}" if arxiv_id else None

        if doi and (not args.only_missing_citations or paper.get("citations") is None):
            key = doi.lower()
            if key not in citation_cache:
                citation_cache[key] = fetch_openalex_citations(doi, args)
                citation_lookups += 1
                time.sleep(args.delay)
            citations = citation_cache[key]
            if citations is not None and paper.get("citations") != citations:
                paper["citations"] = citations
                citation_updates += 1

        repo = extract_github_repo((paper.get("links") or {}).get("code"))
        if repo:
            if github_limit is not None and github_lookups >= github_limit:
                github_skipped_no_token += 1
                continue
            if repo not in github_cache:
                github_cache[repo] = fetch_github_stars(repo[0], repo[1], args)
                github_lookups += 1
                time.sleep(args.delay)
            stars = github_cache[repo]
            if stars is not None and paper.get("github_stars") != stars:
                paper["github_stars"] = stars
                github_updates += 1

    path.write_text(json.dumps(root, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OpenAlex citation lookups: {citation_lookups}")
    print(f"Citation updates: {citation_updates}")
    print(f"GitHub repo lookups: {github_lookups}")
    print(f"GitHub star updates: {github_updates}")
    if github_skipped_no_token:
        print(f"GitHub repos skipped without token: {github_skipped_no_token}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
