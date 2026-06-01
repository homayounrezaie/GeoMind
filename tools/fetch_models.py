#!/usr/bin/env python3
"""Fetch geospatial / Earth-observation models from public sources and merge
them into data/foundation-models.csv.

Sources:
  * Hugging Face Hub   (models by geospatial tag, ranked by downloads)
  * GitHub             (repositories by geospatial + foundation-model topics)

Idempotent: each source replaces only the rows it previously added (tracked by
``status``), and everything is deduplicated by URL and title, so the tool is
safe to re-run to pick up new models.

  python3 tools/fetch_models.py

Note: Papers with Code is intentionally omitted — its public API was sunset and
now redirects to huggingface.co/papers.
"""
import csv
import json
import re
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "foundation-models.csv"
MANAGED_STATUSES = {"huggingface_model", "github_repo"}
ARXIV_RE = re.compile(r"arxiv:(\d{4}\.\d{4,5})")

# --- Hugging Face -----------------------------------------------------------
HF_API = "https://huggingface.co/api/models"
HF_TAGS = [
    "remote-sensing", "earth-observation", "satellite-imagery", "satellite",
    "geospatial", "sar", "hyperspectral", "multispectral", "land-cover",
    "aerial-imagery", "change-detection", "super-resolution",
]
HF_PER_TAG = 500
# Curated geospatial orgs — their models are kept regardless of tags.
# (nasa-impact is omitted: its HF org is mostly NLP / science-text models, not
# Earth-observation — the NASA EO models live under ibm-nasa-geospatial.)
HF_ORGS = ["ibm-nasa-geospatial", "wherobots", "made-with-clay"]
# A kept HF model must carry at least one of these (keeps broad tags like
# "super-resolution"/"satellite" from dragging in generic vision/video models).
CORE_GEO = {
    "remote-sensing", "earth-observation", "satellite-imagery", "satellite",
    "geospatial", "gis", "sar", "synthetic-aperture-radar", "hyperspectral",
    "multispectral", "land-cover", "land-use", "aerial-imagery", "aerial",
    "sentinel", "sentinel-1", "sentinel-2", "landsat", "modis", "eo",
}
HF_SKIP_TAG_PREFIXES = (
    "region:", "endpoints", "license:", "dataset:", "arxiv:", "base_model:",
    "doi:", "model-index", "co2_eq", "autotrain",
)

# --- GitHub -----------------------------------------------------------------
GH_API = "https://api.github.com/search/repositories"
GH_QUERIES = [
    "topic:remote-sensing topic:foundation-model",
    "topic:earth-observation topic:foundation-model",
    "topic:remote-sensing-foundation-model",
    "topic:remote-sensing topic:self-supervised-learning",
    "remote sensing foundation model in:name,description",
    "satellite imagery foundation model in:name,description",
    "geospatial foundation model in:name,description",
    # Curated geospatial GitHub orgs.
    "org:nasa-impact",
    "org:ESA-PhiLab",
    "org:radiantearth",
    "org:Clay-foundation",
]
GH_PER_PAGE = 100
# Substring guard so text queries don't pull in unrelated repos.
GEO_KEYWORDS = (
    "remote sensing", "remote-sensing", "earth observation", "earth-observation",
    "satellite", "geospatial", "hyperspectral", "multispectral", "synthetic aperture",
    "sentinel", "landsat", "aerial", "land cover", "land-cover", "geoscience",
    "earth-obs", " eo ", "sar ",
)
# A kept repo must also look like a model/code project, not docs/data/tooling.
GH_MODEL_SIGNAL = (
    "model", "foundation", "pretrain", "pre-train", "transformer", "segmentation",
    "classification", "detection", "cnn", "vit", "encoder", "embedding", "sam",
    "vlm", "llm", "diffusion", "learning", "neural", "benchmark", "backbone",
    "network", "self-supervised",
)
GH_NAME_DENY = (
    "awesome", "tutorial", "course", "roadmap", "cheat", "handbook", "-docs",
    "bootcamp", "sprint", "hackathon", "-spec", "catalog", "community", "workspace",
)


def http_json(url, headers, timeout=90):
    req = Request(url, headers=headers)
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def blank_row(fields):
    return {fn: "" for fn in fields}


# --- source: Hugging Face ---------------------------------------------------
def fetch_huggingface(fields):
    rows = []
    models = {}
    org_ids = set()  # models from curated geo orgs — kept regardless of tags
    hdrs = {"Accept": "application/json", "User-Agent": "GeoMind-indexer"}
    for tag in HF_TAGS:
        params = urlencode({"filter": tag, "sort": "downloads", "direction": -1,
                            "limit": HF_PER_TAG, "full": "true"})
        try:
            data = http_json(f"{HF_API}?{params}", hdrs)
        except (HTTPError, URLError) as exc:
            print(f"  ! hf {tag}: {exc}", file=sys.stderr)
            continue
        for m in data:
            mid = m.get("id") or m.get("modelId")
            if mid:
                models.setdefault(mid, m)
        print(f"  hf {tag}: {len(data)} (unique {len(models)})")
        time.sleep(0.3)

    for org in HF_ORGS:
        params = urlencode({"author": org, "sort": "downloads", "direction": -1,
                            "limit": 300, "full": "true"})
        try:
            data = http_json(f"{HF_API}?{params}", hdrs)
        except (HTTPError, URLError) as exc:
            print(f"  ! hf org {org}: {exc}", file=sys.stderr)
            continue
        for m in data:
            mid = m.get("id") or m.get("modelId")
            if mid:
                models.setdefault(mid, m)
                org_ids.add(mid)
        print(f"  hf org:{org}: {len(data)} (unique {len(models)})")
        time.sleep(0.3)

    for mid, m in sorted(models.items(), key=lambda kv: -(kv[1].get("downloads") or 0)):
        tags = m.get("tags") or []
        if mid not in org_ids and not ({t.lower() for t in tags} & CORE_GEO):
            continue
        created = m.get("createdAt") or m.get("lastModified") or ""
        arxiv = next((mt.group(1) for t in tags for mt in [ARXIV_RE.match(t)] if mt), "")
        keep_tags = [t for t in tags if not t.startswith(HF_SKIP_TAG_PREFIXES) and "/" not in t][:14]
        note = f"Hugging Face · {(m.get('downloads') or 0):,} downloads · {m.get('likes') or 0} likes"
        if m.get("pipeline_tag"):
            note += f" · {m['pipeline_tag']}"
        url = f"https://huggingface.co/{mid}"
        row = blank_row(fields)
        row.update({
            "_prefix": "hf", "url": url, "title": mid,
            "year": created[:4] if created[:4].isdigit() else "",
            "authors": m.get("author") or "", "venue": "Hugging Face",
            "category": "foundation_models", "publication_type": "model",
            "arxiv_id": arxiv,
            "open_pdf_url": f"https://arxiv.org/pdf/{arxiv}" if arxiv else "",
            "paper_url": f"https://arxiv.org/abs/{arxiv}" if arxiv else "",
            "source": "Hugging Face", "source_query": ", ".join(keep_tags),
            "status": "huggingface_model", "notes": note,
            "code_weights_label": "Weights", "code_weights_url": url,
        })
        rows.append(row)
    return rows


# --- source: GitHub ---------------------------------------------------------
def is_geospatial_repo(repo):
    haystack = " ".join([
        repo.get("full_name", ""), repo.get("description") or "",
        " ".join(repo.get("topics") or []),
    ]).lower()
    if any(d in (repo.get("full_name", "").lower()) for d in GH_NAME_DENY):
        return False
    if not any(k in haystack for k in GEO_KEYWORDS):
        return False
    return any(k in haystack for k in GH_MODEL_SIGNAL)


def fetch_github(fields):
    repos = {}
    for q in GH_QUERIES:
        params = urlencode({"q": q, "sort": "stars", "order": "desc", "per_page": GH_PER_PAGE})
        try:
            data = http_json(f"{GH_API}?{params}", {
                "Accept": "application/vnd.github+json", "User-Agent": "GeoMind-indexer",
            })
        except (HTTPError, URLError) as exc:
            print(f"  ! github {q[:40]}: {exc}", file=sys.stderr)
            time.sleep(8)
            continue
        items = data.get("items") or []
        for repo in items:
            fn = repo.get("full_name")
            if fn:
                repos.setdefault(fn, repo)
        print(f"  github {q[:46]}: {len(items)} (unique {len(repos)})")
        time.sleep(7)  # unauthenticated search is limited to ~10 req/min

    rows = []
    for fn, repo in sorted(repos.items(), key=lambda kv: -(kv[1].get("stargazers_count") or 0)):
        if not is_geospatial_repo(repo):
            continue
        created = repo.get("created_at") or ""
        desc = (repo.get("description") or "").strip()
        note = f"GitHub · {repo.get('stargazers_count') or 0} stars"
        if repo.get("language"):
            note += f" · {repo['language']}"
        if desc:
            note += f" · {desc[:120]}"
        url = repo.get("html_url") or f"https://github.com/{fn}"
        row = blank_row(fields)
        row.update({
            "_prefix": "gh", "url": url, "title": fn,
            "year": created[:4] if created[:4].isdigit() else "",
            "authors": (repo.get("owner") or {}).get("login") or "",
            "venue": "GitHub", "category": "foundation_models",
            "publication_type": "code",
            "source": "GitHub", "source_query": ", ".join((repo.get("topics") or [])[:14]),
            "status": "github_repo", "notes": note,
            "code_weights_label": "Code", "code_weights_url": url,
        })
        rows.append(row)
    return rows


def main():
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        all_rows = list(reader)

    existing = [r for r in all_rows if (r.get("status") or "") not in MANAGED_STATUSES]
    dropped = len(all_rows) - len(existing)
    if dropped:
        print(f"(replacing {dropped} tool-managed rows)")

    seen_urls, seen_titles = set(), set()
    for row in existing:
        for key in ("code_weights_url", "url", "paper_url"):
            v = (row.get(key) or "").strip().lower()
            if v:
                seen_urls.add(v)
        title = (row.get("title") or "").strip().lower()
        if title:
            seen_titles.add(title)

    print("Fetching Hugging Face…")
    hf_rows = fetch_huggingface(fields)
    print("Fetching GitHub…")
    gh_rows = fetch_github(fields)

    counters = {"hf": 0, "gh": 0}
    added = {"hf": 0, "gh": 0}
    new_rows = []
    for row in hf_rows + gh_rows:
        url = (row.get("url") or "").strip().lower()
        title = (row.get("title") or "").strip().lower()
        if url in seen_urls or title in seen_titles:
            continue
        prefix = row.pop("_prefix")
        counters[prefix] += 1
        row["id"] = f"{prefix}{counters[prefix]:04d}"
        new_rows.append(row)
        seen_urls.add(url)
        seen_titles.add(title)
        added[prefix] += 1

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(existing)
        writer.writerows(new_rows)

    print(f"\nAdded {added['hf']} Hugging Face + {added['gh']} GitHub = {len(new_rows)} models.")
    print(f"Total rows: {len(existing) + len(new_rows)} (base {len(existing)}).")


if __name__ == "__main__":
    main()
