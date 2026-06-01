#!/usr/bin/env python3
"""Ingest structured public sources into GeoMind data tables.

Adapters in this script are deliberately source-specific and append-only:
they deduplicate against existing IDs/URLs/titles, attach evidence in source
fields, and mark weak rows as candidates or needs-review.
"""
from __future__ import annotations

import csv
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

HF_DATASET_API = "https://huggingface.co/api/datasets"
ZENODO_API = "https://zenodo.org/api/records"
ARXIV_API = "https://export.arxiv.org/api/query"

HF_DATASET_TAGS = [
    "remote-sensing",
    "earth-observation",
    "satellite-imagery",
    "satellite",
    "geospatial",
    "aerial-imagery",
    "sar",
    "hyperspectral",
    "multispectral",
    "land-cover",
    "change-detection",
    "segmentation",
    "object-detection",
]

CORE_GEO_TERMS = {
    "remote-sensing",
    "earth-observation",
    "satellite-imagery",
    "satellite",
    "geospatial",
    "gis",
    "aerial-imagery",
    "aerial",
    "sar",
    "synthetic-aperture-radar",
    "hyperspectral",
    "multispectral",
    "sentinel",
    "sentinel-1",
    "sentinel-2",
    "landsat",
    "modis",
    "land-cover",
    "land-use",
}

ZENODO_QUERIES = [
    '"remote sensing" dataset',
    '"earth observation" dataset',
    'satellite geospatial dataset',
    'sentinel landsat dataset',
    'SAR hyperspectral dataset',
]

ARXIV_QUERIES = [
    'all:"remote sensing" AND all:"foundation model"',
    'all:"earth observation" AND all:"foundation model"',
    'all:"geospatial" AND all:"large language model"',
    'all:"satellite imagery" AND all:"benchmark"',
    'all:"remote sensing" AND all:"dataset"',
    'all:"cross-view" AND all:"geo-localization"',
]

TASK_RULES = [
    ("image-classification", "image-classification", r"\b(classification|scene|land use|land-use|lcz|crop type)\b"),
    ("semantic-segmentation", "semantic-segmentation", r"\b(segmentation|mask|land cover|land-cover|building footprint|field boundary|cloud cover)\b"),
    ("object-detection", "object-detection", r"\b(object detection|detection|bounding box|ship|vehicle|aircraft|building detection)\b"),
    ("change-detection", "change-detection", r"\b(change detection|change-detection|damage|disaster|flood|wildfire|burn scar)\b"),
    ("geo-localization", "geo-localization", r"\b(geo-localization|geolocalization|visual place recognition|cross-view)\b"),
    ("super-resolution", "super-resolution", r"\b(super-resolution|super resolution|downscaling|pansharpening|pan-sharpening)\b"),
    ("crop-mapping", "crop-mapping", r"\b(crop|cropland|agriculture|field boundary)\b"),
    ("weather-forecasting", "weather-forecasting", r"\b(weather|climate|forecast|precipitation|temperature|storm|cyclone)\b"),
]

DEFAULT_METRICS = {
    "semantic-segmentation": ("mean_intersection_over_union", "Mean Intersection over Union", "mIoU", "true"),
    "object-detection": ("mean_average_precision", "Mean Average Precision", "mAP", "true"),
    "change-detection": ("f1_score", "F1 Score", "F1", "true"),
    "image-classification": ("overall_accuracy", "Overall Accuracy", "OA", "true"),
    "geo-localization": ("recall_at_1", "Recall@1", "R@1", "true"),
    "super-resolution": ("peak_signal_to_noise_ratio", "Peak Signal-to-Noise Ratio", "PSNR", "true"),
    "crop-mapping": ("f1_score", "F1 Score", "F1", "true"),
    "weather-forecasting": ("root_mean_squared_error", "Root Mean Squared Error", "RMSE", "false"),
}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def append_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    if not rows:
        return
    with path.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\r\n")
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def request_json(url: str, timeout: int = 60) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "GeoMind-indexer", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def request_text(url: str, timeout: int = 60) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "GeoMind-indexer"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def slug(value: str, limit: int = 120) -> str:
    value = clean(value).lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:limit].strip("-") or "unknown"


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def pipe(items: list[Any]) -> str:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        value = clean(item).replace("|", "/")
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return "|".join(out)


def truncate(value: str, limit: int = 700) -> str:
    value = clean(value)
    if len(value) > limit:
        return value[: limit - 1].rstrip() + "…"
    return value


def infer_tasks(text: str) -> tuple[list[str], list[str]]:
    cats: list[str] = []
    ids: list[str] = []
    lower = text.lower()
    for category, task_id, pattern in TASK_RULES:
        if re.search(pattern, lower):
            cats.append(category)
            ids.append(task_id)
    return cats[:4], ids[:4]


def size_category(downloads: int | None = None) -> str:
    if downloads is None:
        return ""
    if downloads >= 1_000_000:
        return "1M<n<10M"
    if downloads >= 100_000:
        return "100K<n<1M"
    if downloads >= 10_000:
        return "10K<n<100K"
    if downloads >= 1_000:
        return "1K<n<10K"
    return ""


def hf_datasets(existing_ids: set[str], existing_urls: set[str], existing_names: set[str]) -> list[dict[str, str]]:
    found: dict[str, dict[str, Any]] = {}
    for tag in HF_DATASET_TAGS:
        params = urllib.parse.urlencode(
            {"filter": tag, "sort": "downloads", "direction": -1, "limit": 500, "full": "true"}
        )
        try:
            data = request_json(f"{HF_DATASET_API}?{params}")
        except Exception as exc:  # pragma: no cover - network guard
            print(f"  ! huggingface datasets {tag}: {exc}")
            continue
        for item in data:
            dataset_id = item.get("id")
            if dataset_id:
                found.setdefault(dataset_id, item)
        print(f"  hf datasets {tag}: {len(data)} (unique {len(found)})")
        time.sleep(0.25)

    rows: list[dict[str, str]] = []
    for dataset_id, item in sorted(found.items(), key=lambda kv: -(kv[1].get("downloads") or 0)):
        tags = item.get("tags") or []
        card = item.get("cardData") or {}
        card_tags = card.get("tags") if isinstance(card, dict) else []
        all_tags = [*tags, *(card_tags or [])]
        tag_set = {str(tag).lower() for tag in all_tags}
        if not tag_set & CORE_GEO_TERMS:
            continue
        url = f"https://huggingface.co/datasets/{dataset_id}"
        name = dataset_id.split("/")[-1]
        if dataset_id in existing_ids or url in existing_urls or normalize(name) in existing_names:
            continue
        downloads = int(item.get("downloads") or 0)
        likes = int(item.get("likes") or 0)
        created = clean(item.get("createdAt"))
        modified = clean(item.get("lastModified")) or created
        description = ""
        if isinstance(card, dict):
            description = clean(card.get("pretty_name") or card.get("description") or "")
        if not description:
            description = f"Hugging Face geospatial dataset discovered from tags: {', '.join(sorted(tag_set)[:10])}."
        task_categories, task_ids = infer_tasks(" ".join([dataset_id, " ".join(all_tags), description]))
        license_value = card.get("license") if isinstance(card, dict) else ""
        rows.append(
            {
                "dataset_id": dataset_id,
                "name": name,
                "url": url,
                "matched_terms": pipe(["source:huggingface-ingest", *[f"tag:{tag}" for tag in all_tags[:12]]]),
                "downloads": str(downloads),
                "likes": str(likes),
                "trending_score": str(max(0, min(10, likes // 10 + downloads // 50000))),
                "last_modified": modified,
                "created_at": created,
                "task_categories": pipe(task_categories),
                "task_ids": pipe(task_ids),
                "size_categories": size_category(downloads),
                "languages": pipe(card.get("language") or []) if isinstance(card, dict) else "",
                "tags": pipe(
                    [
                        "geospatial",
                        "remote-sensing",
                        "hugging-face",
                        "source:structured-ingest",
                        *all_tags[:16],
                        f"license:{license_value}" if license_value else "",
                    ]
                ),
                "description": truncate(description),
            }
        )
        existing_ids.add(dataset_id)
        existing_urls.add(url)
        existing_names.add(normalize(name))
    return rows


def zenodo_datasets(existing_ids: set[str], existing_urls: set[str], existing_names: set[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen_records: set[str] = set()
    for query in ZENODO_QUERIES:
        params = urllib.parse.urlencode(
            {
                "q": query,
                "size": 25,
            }
        )
        try:
            payload = request_json(f"{ZENODO_API}?{params}")
        except Exception as exc:  # pragma: no cover - network guard
            print(f"  ! zenodo {query[:36]}: {exc}")
            continue
        hits = payload.get("hits", {}).get("hits", [])
        print(f"  zenodo {query[:42]}: {len(hits)}")
        for hit in hits:
            record_id = str(hit.get("id") or "")
            if not record_id or record_id in seen_records:
                continue
            seen_records.add(record_id)
            meta = hit.get("metadata") or {}
            title = clean(meta.get("title"))
            if not title:
                continue
            text = " ".join([title, clean(meta.get("description")), " ".join(meta.get("keywords") or [])])
            if not re.search(r"remote sensing|earth observation|satellite|geospatial|sentinel|landsat|sar|hyperspectral", text, re.I):
                continue
            dataset_id = f"zenodo/{record_id}"
            url = clean(hit.get("links", {}).get("html") or f"https://zenodo.org/records/{record_id}")
            if dataset_id in existing_ids or url in existing_urls or normalize(title) in existing_names:
                continue
            keywords = meta.get("keywords") or []
            task_categories, task_ids = infer_tasks(text)
            rows.append(
                {
                    "dataset_id": dataset_id,
                    "name": title,
                    "url": url,
                    "matched_terms": pipe(["source:zenodo", f"record:{record_id}", *[f"keyword:{kw}" for kw in keywords[:10]]]),
                    "downloads": "0",
                    "likes": "0",
                    "trending_score": "0",
                    "last_modified": clean(hit.get("updated")) or NOW,
                    "created_at": clean(hit.get("created")) or NOW,
                    "task_categories": pipe(task_categories),
                    "task_ids": pipe(task_ids),
                    "size_categories": "",
                    "languages": "",
                    "tags": pipe(["geospatial", "remote-sensing", "zenodo", "source:structured-ingest", *keywords[:12]]),
                    "description": truncate(clean(meta.get("description")) or f"Zenodo dataset record {record_id}."),
                }
            )
            existing_ids.add(dataset_id)
            existing_urls.add(url)
            existing_names.add(normalize(title))
        time.sleep(0.5)
    return rows


def arxiv_papers(existing_ids: set[str], existing_urls: set[str], existing_titles: set[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
    for query in ARXIV_QUERIES:
        params = urllib.parse.urlencode(
            {
                "search_query": query,
                "start": 0,
                "max_results": 100,
                "sortBy": "submittedDate",
                "sortOrder": "descending",
            }
        )
        try:
            root = ET.fromstring(request_text(f"{ARXIV_API}?{params}"))
        except Exception as exc:  # pragma: no cover - network guard
            print(f"  ! arxiv {query[:36]}: {exc}")
            continue
        entries = root.findall("atom:entry", ns)
        print(f"  arxiv {query}: {len(entries)}")
        for entry in entries:
            raw_id = clean(entry.findtext("atom:id", default="", namespaces=ns))
            arxiv_id = raw_id.rstrip("/").split("/")[-1]
            title = clean(entry.findtext("atom:title", default="", namespaces=ns))
            if not arxiv_id or not title:
                continue
            paper_id = f"paper_{arxiv_id.replace('.', '_').replace('/', '_')}"
            url = f"https://arxiv.org/abs/{arxiv_id}"
            if paper_id in existing_ids or url in existing_urls or normalize(title) in existing_titles:
                continue
            abstract = clean(entry.findtext("atom:summary", default="", namespaces=ns))
            text = f"{title} {abstract}"
            if not re.search(r"remote sensing|earth observation|satellite|geospatial|sentinel|landsat|SAR|hyperspectral|geo-localization", text, re.I):
                continue
            authors = "; ".join(
                clean(author.findtext("atom:name", default="", namespaces=ns))
                for author in entry.findall("atom:author", ns)
                if clean(author.findtext("atom:name", default="", namespaces=ns))
            )
            published = clean(entry.findtext("atom:published", default="", namespaces=ns))
            pdf_url = ""
            for link in entry.findall("atom:link", ns):
                if link.attrib.get("title") == "pdf":
                    pdf_url = link.attrib.get("href", "")
                    break
            rows.append(
                {
                    "id": paper_id,
                    "year": published[:4] if published[:4].isdigit() else "",
                    "title": title,
                    "authors": authors,
                    "venue": "arXiv",
                    "doi": f"10.48550/arXiv.{arxiv_id}",
                    "url": url,
                    "openalex_id": "",
                    "abstract": truncate(abstract, 1200),
                    "code_url": "",
                    "citation_count": "0",
                    "introduces_models": "",
                    "uses_datasets": "",
                    "pdf_url": pdf_url or f"https://arxiv.org/pdf/{arxiv_id}",
                    "arxiv_url": url,
                    "github_url": "",
                    "huggingface_url": "",
                    "project_url": "",
                    "thumbnail_url": "",
                    "thumbnail_status": "",
                }
            )
            existing_ids.add(paper_id)
            existing_urls.add(url)
            existing_titles.add(normalize(title))
        time.sleep(3.1)
    return rows


def benchmark_rows_for_datasets(
    datasets: list[dict[str, str]], existing_benchmark_ids: set[str]
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for dataset in datasets:
        text = " ".join([dataset.get("name", ""), dataset.get("tags", ""), dataset.get("description", "")])
        if not re.search(r"\b(benchmark|challenge|competition|leaderboard)\b", text, re.I):
            continue
        task_categories = dataset.get("task_categories", "").split("|") if dataset.get("task_categories") else []
        if not task_categories:
            task_categories, _ = infer_tasks(text)
        for category in task_categories[:2]:
            metric = DEFAULT_METRICS.get(category)
            if not metric:
                continue
            metric_id, metric_name, metric_abbr, higher = metric
            benchmark_id = f"structured_ingest_{slug(category)}_{slug(dataset['dataset_id'])}_{metric_id}"
            if benchmark_id in existing_benchmark_ids:
                continue
            rows.append(
                {
                    "benchmark_id": benchmark_id,
                    "paper_id": "",
                    "task_id": f"task_{category.replace('-', '_')}",
                    "task_name": category.replace("-", " ").title(),
                    "dataset_id": dataset["dataset_id"],
                    "dataset_name": dataset["name"],
                    "metric_id": metric_id,
                    "metric_name": metric_name,
                    "metric_abbreviation": metric_abbr,
                    "higher_is_better": higher,
                    "split": "",
                    "score_value": "",
                    "score_unit": "",
                    "status": "candidate",
                    "evidence": f"Structured source identified dataset/resource as benchmark or challenge: {dataset['name']}.",
                    "evidence_source": pipe(["source:structured-ingest", dataset.get("url", ""), dataset.get("matched_terms", "")]),
                    "confidence": "0.40",
                    "extraction_method": "structured_source_dataset_flag",
                }
            )
            existing_benchmark_ids.add(benchmark_id)
    return rows


def main() -> None:
    dataset_fields, datasets = read_csv(DATA / "datasets.csv")
    benchmark_fields, benchmarks = read_csv(DATA / "benchmarks.csv")
    paper_fields, papers = read_csv(DATA / "papers.csv")

    existing_dataset_ids = {row["dataset_id"] for row in datasets}
    existing_dataset_urls = {row.get("url", "") for row in datasets if row.get("url")}
    existing_dataset_names = {normalize(row.get("name", "")) for row in datasets if row.get("name")}

    existing_paper_ids = {row["id"] for row in papers}
    existing_paper_urls = {row.get("url", "") for row in papers if row.get("url")}
    existing_paper_titles = {normalize(row.get("title", "")) for row in papers if row.get("title")}

    existing_benchmark_ids = {row["benchmark_id"] for row in benchmarks}

    print("Fetching Hugging Face datasets...")
    hf_rows = hf_datasets(existing_dataset_ids, existing_dataset_urls, existing_dataset_names)
    print("Fetching Zenodo datasets...")
    zenodo_rows = zenodo_datasets(existing_dataset_ids, existing_dataset_urls, existing_dataset_names)
    new_dataset_rows = hf_rows + zenodo_rows

    print("Fetching arXiv papers...")
    new_paper_rows = arxiv_papers(existing_paper_ids, existing_paper_urls, existing_paper_titles)
    new_benchmark_rows = benchmark_rows_for_datasets(new_dataset_rows, existing_benchmark_ids)

    append_csv(DATA / "datasets.csv", dataset_fields, new_dataset_rows)
    append_csv(DATA / "papers.csv", paper_fields, new_paper_rows)
    append_csv(DATA / "benchmarks.csv", benchmark_fields, new_benchmark_rows)

    print(
        "ingested "
        f"datasets={len(new_dataset_rows)} "
        f"(hf={len(hf_rows)}, zenodo={len(zenodo_rows)}) "
        f"papers={len(new_paper_rows)} benchmarks={len(new_benchmark_rows)}"
    )
    print("dataset_sources", Counter(row["dataset_id"].split("/", 1)[0] for row in new_dataset_rows).most_common())


if __name__ == "__main__":
    main()
