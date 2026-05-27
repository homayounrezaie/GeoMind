#!/usr/bin/env python3
import argparse
import csv
import html
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "papers.csv"
DEFAULT_CACHE = ROOT / ".cache" / "paper_metadata_cache.json"
USER_AGENT = "GeoMind metadata enrichment (https://github.com/homayounrezaie/GeoMind)"
ARXIV_NS = {"atom": "http://www.w3.org/2005/Atom"}
NEW_COLUMNS = ["pdf_url", "arxiv_url", "github_url", "huggingface_url", "project_url", "abstract_source"]


def main():
    parser = argparse.ArgumentParser(description="Enrich data/papers.csv with abstracts and share links.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--limit", type=int, default=0, help="Only process this many missing abstracts; 0 means all.")
    parser.add_argument("--skip-title-search", action="store_true")
    args = parser.parse_args()

    rows, fieldnames = read_csv(args.csv)
    fieldnames = add_columns(fieldnames, NEW_COLUMNS)
    cache = read_cache(args.cache)

    normalize_links(rows)
    print_counts("before", rows)

    enrich_from_arxiv(rows, cache, args.limit)
    write_cache(args.cache, cache)
    enrich_from_openalex_ids(rows, cache, args.limit)
    write_cache(args.cache, cache)
    enrich_from_openalex_dois(rows, cache, args.limit)
    write_cache(args.cache, cache)
    if not args.skip_title_search:
        enrich_from_openalex_titles(rows, cache, args.limit, args.cache)
        write_cache(args.cache, cache)

    write_csv(args.csv, fieldnames, rows)
    write_cache(args.cache, cache)
    print_counts("after", rows)


def read_csv(path):
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader), list(reader.fieldnames or [])


def write_csv(path, fieldnames, rows):
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def add_columns(fieldnames, columns):
    result = list(fieldnames)
    for col in columns:
        if col not in result:
            result.append(col)
    return result


def read_cache(path):
    if not path.exists():
        return {"arxiv": {}, "openalex": {}, "crossref": {}}
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    data.setdefault("arxiv", {})
    data.setdefault("openalex", {})
    data.setdefault("crossref", {})
    return data


def write_cache(path, cache):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, sort_keys=True)


def print_counts(label, rows):
    total = len(rows)
    missing = sum(1 for row in rows if not clean(row.get("abstract")))
    github = sum(1 for row in rows if clean(row.get("github_url")))
    hf = sum(1 for row in rows if clean(row.get("huggingface_url")))
    pdf = sum(1 for row in rows if clean(row.get("pdf_url")))
    arxiv = sum(1 for row in rows if clean(row.get("arxiv_url")))
    project = sum(1 for row in rows if clean(row.get("project_url")))
    print(f"{label}: rows={total} missing_abstract={missing} pdf={pdf} arxiv={arxiv} github={github} huggingface={hf} project={project}", flush=True)


def normalize_links(rows):
    for row in rows:
        raw = raw_json(row)
        all_urls = collect_urls(row, raw)

        arxiv = clean_arxiv_id(row.get("arxiv_id") or raw.get("arxiv_id"))
        if not clean(row.get("arxiv_url")) and arxiv:
            row["arxiv_url"] = f"https://arxiv.org/abs/{arxiv}"
        if not clean(row.get("pdf_url")) and arxiv:
            row["pdf_url"] = f"https://arxiv.org/pdf/{arxiv}"

        for url in all_urls:
            normalized = normalize_url(url)
            if not normalized:
                continue
            if "arxiv.org/abs/" in normalized and not clean(row.get("arxiv_url")):
                row["arxiv_url"] = normalized
            if "arxiv.org/pdf/" in normalized and not clean(row.get("pdf_url")):
                row["pdf_url"] = normalized
            if "arxiv.org/abs/" in normalized and not clean(row.get("pdf_url")):
                row["pdf_url"] = normalized.replace("/abs/", "/pdf/")
            if "github.com/" in normalized and not clean(row.get("github_url")):
                row["github_url"] = github_repo_url(normalized) or normalized
            if "huggingface.co/" in normalized and not clean(row.get("huggingface_url")):
                row["huggingface_url"] = huggingface_url(normalized)

        if not clean(row.get("project_url")):
            for url in all_urls:
                normalized = normalize_url(url)
                if normalized and is_project_url(normalized):
                    row["project_url"] = normalized
                    break


def collect_urls(row, raw):
    values = []
    for key in ["url", "link", "code_url", "open_pdf_url", "paper_url", "code_weights_url", "github_url", "huggingface_url", "project_url"]:
        values.append(row.get(key, ""))
        values.append(raw.get(key, ""))
    return re.findall(r"https?://[^\s\"'<>;,]+", " ".join(str(v or "") for v in values))


def enrich_from_arxiv(rows, cache, limit):
    candidates = [row for row in rows if needs_abstract(row) and clean_arxiv_id(row.get("arxiv_id"))]
    if limit:
        candidates = candidates[:limit]
    ids = [clean_arxiv_id(row.get("arxiv_id")) for row in candidates]
    missing_ids = [arxiv for arxiv in sorted(set(ids)) if arxiv not in cache["arxiv"]]
    print(f"arxiv: candidates={len(candidates)} uncached={len(missing_ids)}", flush=True)

    for batch in chunks(missing_ids, 100):
        url = "https://export.arxiv.org/api/query?id_list=" + ",".join(urllib.parse.quote(item) for item in batch)
        try:
            body = fetch_text(url)
            cache["arxiv"].update(parse_arxiv_response(body))
        except Exception as exc:
            print(f"arxiv batch failed: {exc}", flush=True)
        time.sleep(0.5)

    applied = 0
    for row in candidates:
        arxiv = clean_arxiv_id(row.get("arxiv_id"))
        abstract = cache["arxiv"].get(arxiv, {}).get("abstract", "")
        if apply_abstract(row, abstract, "arxiv"):
            applied += 1
    print(f"arxiv: applied={applied}", flush=True)


def enrich_from_openalex_ids(rows, cache, limit):
    candidates = [row for row in rows if needs_abstract(row) and clean(row.get("openalex_id"))]
    if limit:
        candidates = candidates[:limit]
    ids = [normalize_openalex_id(row.get("openalex_id")) for row in candidates]
    missing_ids = [oid for oid in sorted(set(ids)) if oid and oid not in cache["openalex"]]
    print(f"openalex ids: candidates={len(candidates)} uncached={len(missing_ids)}", flush=True)

    for batch in chunks(missing_ids, 25):
        filt = "openalex_id:" + "|".join(f"https://openalex.org/{oid}" for oid in batch)
        fetch_openalex_batch(filt, cache)
        time.sleep(0.15)

    applied = 0
    for row in candidates:
        oid = normalize_openalex_id(row.get("openalex_id"))
        data = cache["openalex"].get(oid, {})
        if apply_openalex_data(row, data):
            applied += 1
    print(f"openalex ids: applied={applied}", flush=True)


def enrich_from_openalex_dois(rows, cache, limit):
    candidates = [row for row in rows if needs_abstract(row) and clean(row.get("doi"))]
    if limit:
        candidates = candidates[:limit]
    dois = [clean_doi(row.get("doi")) for row in candidates]
    missing = [doi for doi in sorted(set(dois)) if doi and f"doi:{doi}" not in cache["openalex"]]
    print(f"openalex dois: candidates={len(candidates)} uncached={len(missing)}", flush=True)

    for batch in chunks(missing, 25):
        filt = "doi:" + "|".join(batch)
        fetch_openalex_batch(filt, cache, key_prefix="doi:")
        time.sleep(0.15)

    applied = 0
    for row in candidates:
        data = cache["openalex"].get(f"doi:{clean_doi(row.get('doi'))}", {})
        if apply_openalex_data(row, data):
            applied += 1
    print(f"openalex dois: applied={applied}", flush=True)


def enrich_from_openalex_titles(rows, cache, limit, cache_path):
    candidates = [row for row in rows if needs_abstract(row) and clean(row.get("title"))]
    if limit:
        candidates = candidates[:limit]
    print(f"openalex title search: candidates={len(candidates)}", flush=True)
    applied = 0
    fetched = 0
    for index, row in enumerate(candidates, 1):
        key = "title:" + row["title"].strip().casefold()
        if key not in cache["openalex"]:
            params = urllib.parse.urlencode({"search": row["title"], "per-page": 1})
            url = "https://api.openalex.org/works?" + params
            try:
                data = fetch_json(url)
                result = (data.get("results") or [{}])[0]
                cache["openalex"][key] = compact_openalex_work(result)
                fetched += 1
            except Exception as exc:
                print(f"title search failed for {row.get('id')}: {exc}", flush=True)
                cache["openalex"][key] = {}
            time.sleep(0.15)
        if apply_openalex_data(row, cache["openalex"].get(key, {})):
            applied += 1
        if index % 50 == 0:
            write_cache(cache_path, cache)
            print(f"openalex title search: processed={index}/{len(candidates)} applied={applied}", flush=True)
    print(f"openalex title search: fetched={fetched} applied={applied}", flush=True)


def fetch_openalex_batch(filter_value, cache, key_prefix=""):
    params = urllib.parse.urlencode({"filter": filter_value, "per-page": 50})
    url = "https://api.openalex.org/works?" + params
    try:
        data = fetch_json(url)
    except Exception as exc:
        print(f"openalex batch failed: {exc}", flush=True)
        return
    for work in data.get("results", []):
        compact = compact_openalex_work(work)
        oid = normalize_openalex_id(compact.get("id", ""))
        if oid:
            cache["openalex"][oid] = compact
        doi = clean_doi(compact.get("doi", ""))
        if doi:
            cache["openalex"][f"doi:{doi}"] = compact
        if key_prefix and key_prefix != "doi:":
            cache["openalex"][key_prefix + (oid or doi)] = compact


def compact_openalex_work(work):
    if not work:
        return {}
    ids = work.get("ids") or {}
    primary = work.get("primary_location") or {}
    source = primary.get("source") or {}
    return {
        "id": work.get("id", ""),
        "doi": work.get("doi") or ids.get("doi", ""),
        "title": work.get("title") or work.get("display_name", ""),
        "abstract": openalex_abstract(work.get("abstract_inverted_index")),
        "pdf_url": (primary.get("pdf_url") or ""),
        "landing_page_url": (primary.get("landing_page_url") or ""),
        "source_url": source.get("homepage_url") or "",
    }


def apply_openalex_data(row, data):
    if not data:
        return False
    applied = apply_abstract(row, data.get("abstract", ""), "openalex")
    if data.get("pdf_url") and not clean(row.get("pdf_url")):
        row["pdf_url"] = data["pdf_url"]
    if data.get("landing_page_url") and not clean(row.get("project_url")) and is_project_url(data["landing_page_url"]):
        row["project_url"] = data["landing_page_url"]
    return applied


def apply_abstract(row, abstract, source):
    abstract = clean_abstract(abstract)
    if not abstract or not needs_abstract(row):
        return False
    row["abstract"] = abstract
    row["abstract_source"] = source
    return True


def needs_abstract(row):
    return not clean(row.get("abstract"))


def parse_arxiv_response(body):
    root = ET.fromstring(body)
    result = {}
    for entry in root.findall("atom:entry", ARXIV_NS):
        id_url = entry.findtext("atom:id", default="", namespaces=ARXIV_NS)
        arxiv = clean_arxiv_id(id_url.rsplit("/", 1)[-1])
        summary = entry.findtext("atom:summary", default="", namespaces=ARXIV_NS)
        pdf = ""
        for link in entry.findall("atom:link", ARXIV_NS):
            if link.attrib.get("title") == "pdf" or link.attrib.get("type") == "application/pdf":
                pdf = link.attrib.get("href", "")
        if arxiv:
            result[arxiv] = {"abstract": clean_abstract(summary), "pdf_url": pdf}
    return result


def openalex_abstract(inverted):
    if not inverted:
        return ""
    positions = []
    for word, indexes in inverted.items():
        for index in indexes:
            positions.append((index, word))
    return " ".join(word for _, word in sorted(positions))


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def clean(value):
    return str(value or "").strip()


def clean_abstract(value):
    value = html.unescape(str(value or ""))
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def clean_arxiv_id(value):
    value = clean(value)
    value = re.sub(r"^https?://arxiv\.org/(abs|pdf)/", "", value, flags=re.I)
    value = value.replace(".pdf", "")
    return value


def clean_doi(value):
    value = clean(value)
    value = re.sub(r"^https?://(dx\.)?doi\.org/", "", value, flags=re.I)
    return value.lower()


def normalize_openalex_id(value):
    value = clean(value)
    if not value:
        return ""
    return value.rstrip("/").rsplit("/", 1)[-1]


def normalize_url(value):
    value = clean(value).rstrip(").,]")
    return value if value.startswith(("http://", "https://")) else ""


def github_repo_url(url):
    match = re.search(r"github\.com/([^/\s?#]+)/([^/\s?#]+)", url, flags=re.I)
    if not match:
        return ""
    return f"https://github.com/{match.group(1)}/{match.group(2).removesuffix('.git')}"


def huggingface_url(url):
    match = re.search(r"huggingface\.co/([^/\s?#]+)(?:/([^/\s?#]+))?", url, flags=re.I)
    if not match:
        return url
    if match.group(2):
        return f"https://huggingface.co/{match.group(1)}/{match.group(2)}"
    return f"https://huggingface.co/{match.group(1)}"


def is_project_url(url):
    low = url.lower()
    blocked = ["openalex.org", "doi.org", "arxiv.org", "ieeexplore.ieee.org", "springer.com", "sciencedirect.com"]
    return not any(domain in low for domain in blocked)


def raw_json(row):
    try:
        return json.loads(row.get("raw_json") or "{}")
    except json.JSONDecodeError:
        return {}


def chunks(values, size):
    for i in range(0, len(values), size):
        yield values[i : i + size]


if __name__ == "__main__":
    main()
