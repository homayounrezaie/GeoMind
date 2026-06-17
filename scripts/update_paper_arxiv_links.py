#!/usr/bin/env python3
"""Fill missing arXiv links from strong title matches.

The script uses Semantic Scholar's title-match endpoint and only updates a
paper when the returned title normalizes to the local title. It does not use
loose web search results.
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
import xml.etree.ElementTree as ET
from pathlib import Path


ARXIV_ID_RE = re.compile(r"^\d{4}\.\d{4,5}(?:v\d+)?$", re.IGNORECASE)
ARXIV_DOI_RE = re.compile(r"10\.48550/arxiv\.([0-9]{4}\.[0-9]{4,5})(?:v\d+)?", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--papers", default="data/papers.json")
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--timeout", type=float, default=20)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--rate-limit-wait", type=float, default=30)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--progress-every", type=int, default=100)
    parser.add_argument("--source", choices=["arxiv", "semantic-scholar"], default="arxiv")
    parser.add_argument("--batch-size", type=int, default=8)
    return parser.parse_args()


def normalize_title(title: str) -> str:
    title = title.casefold()
    title = title.replace("&", " and ")
    title = re.sub(r"[\u2010-\u2015]", "-", title)
    title = re.sub(r"[^a-z0-9]+", " ", title)
    return " ".join(title.split())


def arxiv_abs_url(arxiv_id: str) -> str:
    arxiv_id = arxiv_id.removesuffix(".pdf")
    arxiv_id = re.sub(r"v\d+$", "", arxiv_id)
    return f"https://arxiv.org/abs/{arxiv_id}"


def clean_arxiv_id(value: str | int | None) -> str | None:
    if value is None:
        return None
    arxiv_id = str(value).strip()
    arxiv_id = arxiv_id.removeprefix("arXiv:")
    arxiv_id = arxiv_id.removeprefix("arxiv:")
    if ARXIV_ID_RE.match(arxiv_id):
        return arxiv_id
    return None


def headers() -> dict[str, str]:
    result = {
        "Accept": "application/json",
        "User-Agent": "GeoMind arXiv link updater",
    }
    token = os.getenv("S2_API_KEY")
    if token:
        result["x-api-key"] = token
    return result


def request_json(url: str, args: argparse.Namespace) -> dict | None:
    last_error: Exception | None = None
    for attempt in range(args.retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers())
            with urllib.request.urlopen(req, timeout=args.timeout) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            last_error = error
            wait = args.rate_limit_wait if error.code in {403, 429} else 2**attempt
        except (TimeoutError, urllib.error.URLError) as error:
            last_error = error
            wait = 2**attempt

        if attempt < args.retries:
            time.sleep(wait)

    print(f"warning: request failed: {url}: {last_error}", file=sys.stderr)
    return None


def semantic_scholar_match(title: str, args: argparse.Namespace) -> dict | None:
    query = urllib.parse.urlencode({"query": title, "fields": "title,externalIds,year"})
    url = f"https://api.semanticscholar.org/graph/v1/paper/search/match?{query}"
    data = request_json(url, args)
    if not data:
        return None
    results = data.get("data")
    if not isinstance(results, list) or not results:
        return None
    return results[0] if isinstance(results[0], dict) else None


def request_text(url: str, args: argparse.Namespace) -> str | None:
    last_error: Exception | None = None
    for attempt in range(args.retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "GeoMind arXiv link updater"})
            with urllib.request.urlopen(req, timeout=args.timeout) as response:
                return response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as error:
            last_error = error
            wait = args.rate_limit_wait if error.code in {403, 429, 503} else 2**attempt
        except (TimeoutError, urllib.error.URLError) as error:
            last_error = error
            wait = 2**attempt

        if attempt < args.retries:
            time.sleep(wait)

    print(f"warning: request failed: {url}: {last_error}", file=sys.stderr)
    return None


def arxiv_query_for_titles(titles: list[str]) -> str:
    parts = []
    for title in titles:
        clean = title.replace('"', "").strip()
        if clean:
            parts.append(f'ti:"{clean}"')
    return " OR ".join(parts)


def arxiv_batch_matches(titles: list[str], args: argparse.Namespace) -> dict[str, str]:
    query = arxiv_query_for_titles(titles)
    if not query:
        return {}
    url = "https://export.arxiv.org/api/query?" + urllib.parse.urlencode(
        {"search_query": query, "start": 0, "max_results": max(20, len(titles) * 3)}
    )
    text = request_text(url, args)
    if not text:
        return {}

    try:
        root = ET.fromstring(text)
    except ET.ParseError as error:
        print(f"warning: could not parse arXiv response: {error}", file=sys.stderr)
        return {}

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    wanted = {normalize_title(title) for title in titles}
    matches: dict[str, str] = {}
    for entry in root.findall("atom:entry", ns):
        title = " ".join((entry.findtext("atom:title", default="", namespaces=ns) or "").split())
        id_url = entry.findtext("atom:id", default="", namespaces=ns) or ""
        normalized = normalize_title(title)
        if normalized not in wanted:
            continue
        arxiv_id = id_url.rstrip("/").rsplit("/", 1)[-1]
        arxiv_id = re.sub(r"v\d+$", "", arxiv_id)
        if clean_arxiv_id(arxiv_id):
            matches[normalized] = arxiv_abs_url(arxiv_id)
    return matches


def arxiv_id_from_match(local_title: str, match: dict | None) -> str | None:
    if not match:
        return None
    remote_title = match.get("title")
    if not isinstance(remote_title, str):
        return None
    if normalize_title(remote_title) != normalize_title(local_title):
        return None
    external_ids = match.get("externalIds")
    if not isinstance(external_ids, dict):
        return None
    arxiv_id = clean_arxiv_id(external_ids.get("ArXiv"))
    if arxiv_id:
        return arxiv_id
    doi = external_ids.get("DOI")
    if isinstance(doi, str):
        doi_match = ARXIV_DOI_RE.search(doi)
        if doi_match:
            return doi_match.group(1)
    return None


def main() -> int:
    args = parse_args()
    path = Path(args.papers)
    root = json.loads(path.read_text(encoding="utf-8"))
    papers = root.get("papers") if isinstance(root, dict) else root
    if not isinstance(papers, list):
        raise SystemExit("papers file must contain a list or a top-level 'papers' list")

    candidates = [paper for paper in papers if not (paper.get("links") or {}).get("arxiv")]
    if args.limit is not None:
        candidates = candidates[: args.limit]

    updates = 0
    checked = 0
    if args.source == "arxiv":
        for start in range(0, len(candidates), args.batch_size):
            batch = candidates[start : start + args.batch_size]
            checked += len(batch)
            if args.progress_every and checked % args.progress_every < args.batch_size:
                print(f"Checked {checked}/{len(candidates)} missing arXiv records...", flush=True)

            titles = [paper["title"] for paper in batch if isinstance(paper.get("title"), str)]
            matches = arxiv_batch_matches(titles, args)
            for paper in batch:
                arxiv_url = matches.get(normalize_title(str(paper.get("title") or "")))
                if arxiv_url:
                    paper.setdefault("links", {})["arxiv"] = arxiv_url
                    updates += 1
            time.sleep(args.delay)
    else:
        for paper in candidates:
            checked += 1
            if args.progress_every and checked % args.progress_every == 0:
                print(f"Checked {checked}/{len(candidates)} missing arXiv records...", flush=True)

            title = paper.get("title")
            if not isinstance(title, str) or not title.strip():
                continue

            match = semantic_scholar_match(title, args)
            arxiv_id = arxiv_id_from_match(title, match)
            if arxiv_id:
                paper.setdefault("links", {})["arxiv"] = arxiv_abs_url(arxiv_id)
                updates += 1
            time.sleep(args.delay)

    path.write_text(json.dumps(root, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Missing arXiv records checked: {checked}")
    print(f"ArXiv links added: {updates}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
