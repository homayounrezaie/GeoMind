#!/usr/bin/env python3
"""Conservative relevance cleanup for GeoMind data tables.

The rules here intentionally avoid deleting broad but useful GeoAI rows. They
only remove rows that are clearly out-of-domain, parser artifacts, or model
rows that are not real model/code entries.
"""
from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

GEO_TERMS = [
    "remote sensing",
    "earth observation",
    "earth surface",
    "remote semantic",
    "geospatial",
    "geo-spatial",
    "geoai",
    "geographic",
    "geographical",
    "geography",
    "geodata",
    "geomatics",
    "satellite",
    "imagery",
    "aerial",
    "uav",
    "drone",
    "gis",
    "map",
    "mapping",
    "cartograph",
    "spatial",
    "spatiotemporal",
    "spatio-temporal",
    "location",
    "geolocation",
    "geo-localization",
    "geolocalization",
    "localization",
    "cross-view",
    "sar",
    "synthetic aperture",
    "hyperspectral",
    "multispectral",
    "sentinel",
    "landsat",
    "modis",
    "viirs",
    "naip",
    "eurosat",
    "satlas",
    "lidar",
    "insar",
    "radar",
    "terrain",
    "land cover",
    "land-cover",
    "land use",
    "land-use",
    "crop",
    "agriculture",
    "agricultural",
    "forest",
    "vegetation",
    "flood",
    "wildfire",
    "fire",
    "hurricane",
    "cyclone",
    "drought",
    "rainfall",
    "river",
    "vessel",
    "ship",
    "volcano",
    "geolog",
    "environment",
    "ecosystem",
    "hydrolog",
    "water",
    "wetland",
    "snow",
    "ice",
    "glacier",
    "earthquake",
    "seismic",
    "urban",
    "building",
    "road",
    "traffic",
    "climate",
    "weather",
    "precipitation",
    "ocean",
    "marine",
    "coastal",
    "bathymetry",
    "dem",
    "elevation",
    "point cloud",
    "photogrammetry",
    "openstreetmap",
    "osm",
    "planet",
    "maxar",
    "change detection",
    "landslide",
    "disaster",
    "mobility",
    "trajectory",
    "navigation",
    "place recognition",
    "soil",
    "mining",
    "solar photovoltaic",
    "streetview",
    "street view",
    "gps",
    "route",
    "metro station",
    "geocoding",
    "geoprivacy",
]

STRONG_GEO_TERMS = [
    term
    for term in GEO_TERMS
    if term
    not in {
        "sentinel",
        "hyperspectral",
        "spectral",
        "spatial",
        "location",
        "localization",
        "environment",
    }
]

OUT_OF_DOMAIN_TERMS = [
    "histopathology",
    "pathology",
    "medical",
    "clinical",
    "oncology",
    "biomedical",
    "healthcare",
    "skin lesion",
    "chest",
    "radiology",
    "surgery",
    "hospital",
    "wearable sensor",
    "human action recognition",
    "speech",
    "depression detection",
    "education",
    "mathematical reasoning",
    "numeracy",
    "function calling",
    "llm-as-a-judge",
    "molecular",
    "phonon",
    "spectroscopy",
    "optics",
    "photonics",
    "electrocatalyst",
    "manufacturing",
    "zero-defect",
    "penicillin",
    "pharma",
    "bioprocess",
    "financial",
    "finance",
    "enterprise planning",
    "animation video",
    "zoological",
    "classical dance",
    "gesture recognition",
    "social media photographs",
    "infectious disease",
    "nutrition",
    "biomedical engineering",
    "password",
    "cybersecurity",
    "name matching",
    "phonetic embeddings",
    "protein",
    "drug discovery",
    "therapeutics",
    "blood glucose",
    "mammogram",
    "polyp",
    "audio-visual speech",
    "accounting",
]

GENERIC_ARTIFACT_NAMES = {
    "link",
    "last commit",
    "github stars",
    "star",
    "![star",
    "![",
    "home",
    "paper",
    "code",
    "pdf",
    "project page",
    "kaggle blog",
    "search results here",
}

GENERIC_ARTIFACT_PATTERNS = [
    r"img\.shields\.io",
    r"blog\.kaggle\.com",
    r"/search\?",
    r"winner.?s? interview",
    r"\bused xgboost\b",
    r"hybrid human/ml approach",
]

BAD_DATASET_PATTERNS = [
    r"golden-batch-sentinel",
    r"black eagle sentinel",
    r"medical-vector-sentinel",
    r"context_boundary_sentinel",
    r"\bmore amber-afno\b",
    r"\bamber-afno\b.*medical",
    r"\byelp\b",
    r"\blj speech\b",
    r"\bm-ailabs speech\b",
    r"\bcodeneuro\b",
    r"\bopenneuro\b",
    r"\bcamyla\b",
    r"\bdynamicpdb\b",
    r"\bmol-instructions\b",
    r"\btherapeutics data commons\b",
    r"\bproteingym\b",
    r"\bchinese medical dataset\b",
    r"\barc virtual cell atlas\b",
    r"\boncology datasets\b",
    r"\bporcine hyperspectral\b",
    r"\bblood detection in hyperspectral\b",
    r"\bhyperspectral placenta\b",
]

MODEL_KEEP_STATUSES = {
    "candidate_model",
    "candidate_adapter_model",
    "github_repo",
    "huggingface_model",
}

GEO_RE = re.compile("|".join(re.escape(t) for t in sorted(GEO_TERMS, key=len, reverse=True)), re.I)
STRONG_GEO_RE = re.compile("|".join(re.escape(t) for t in sorted(STRONG_GEO_TERMS, key=len, reverse=True)), re.I)
OUT_RE = re.compile("|".join(re.escape(t) for t in sorted(OUT_OF_DOMAIN_TERMS, key=len, reverse=True)), re.I)
ARTIFACT_RE = re.compile("|".join(GENERIC_ARTIFACT_PATTERNS), re.I)
BAD_DATASET_RE = re.compile("|".join(BAD_DATASET_PATTERNS), re.I)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows({field: row.get(field, "") for field in fields} for row in rows)


def row_text(row: dict[str, str]) -> str:
    return " ".join(str(value) for value in row.values() if value)


def real_model_link(row: dict[str, str]) -> bool:
    url = (row.get("code_weights_url") or "").strip()
    if url.startswith("https://github.com/"):
        return True
    if url.startswith("https://huggingface.co/") and "/papers/" not in url and "/datasets/" not in url:
        return True
    return False


def slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "row"


def is_out_of_domain_without_geo(row: dict[str, str]) -> bool:
    text = row_text(row)
    return bool(OUT_RE.search(text) and not GEO_RE.search(text))


def clean_models() -> tuple[int, set[str]]:
    fields, rows = read_csv(DATA / "foundation-models.csv")
    kept: list[dict[str, str]] = []
    removed_ids: set[str] = set()
    reasons: Counter[str] = Counter()

    for row in rows:
        row_id = row.get("id", "")
        if row.get("status") not in MODEL_KEEP_STATUSES:
            removed_ids.add(row_id)
            reasons["not_model_status"] += 1
            continue
        if not real_model_link(row):
            removed_ids.add(row_id)
            reasons["missing_real_model_link"] += 1
            continue
        if is_out_of_domain_without_geo(row):
            removed_ids.add(row_id)
            reasons["out_of_domain_model"] += 1
            continue
        kept.append(row)

    write_csv(DATA / "foundation-models.csv", fields, kept)
    print(f"models: removed {len(rows) - len(kept)} kept {len(kept)} {dict(reasons)}")
    return len(rows) - len(kept), removed_ids


def clean_papers() -> tuple[int, set[str]]:
    fields, rows = read_csv(DATA / "papers.csv")
    kept: list[dict[str, str]] = []
    removed_ids: set[str] = set()

    for row in rows:
        if is_out_of_domain_without_geo(row):
            removed_ids.add(row.get("id", ""))
            continue
        kept.append(row)

    write_csv(DATA / "papers.csv", fields, kept)
    print(f"papers: removed {len(rows) - len(kept)} kept {len(kept)}")
    return len(rows) - len(kept), removed_ids


def clean_datasets(removed_paper_ids: set[str]) -> tuple[int, set[str]]:
    fields, rows = read_csv(DATA / "datasets.csv")
    kept: list[dict[str, str]] = []
    removed_ids: set[str] = set()
    reasons: Counter[str] = Counter()

    for row in rows:
        name = (row.get("name") or "").strip().lower()
        text = row_text(row)
        if name in GENERIC_ARTIFACT_NAMES or ARTIFACT_RE.search(text):
            removed_ids.add(row.get("dataset_id", ""))
            reasons["parser_artifact"] += 1
            continue
        if BAD_DATASET_RE.search(text):
            removed_ids.add(row.get("dataset_id", ""))
            reasons["known_out_of_domain_dataset"] += 1
            continue
        # Medical/science hyperspectral rows are common false positives: keep
        # them only when there is a stronger Earth/geo signal.
        if OUT_RE.search(text) and not STRONG_GEO_RE.search(text):
            removed_ids.add(row.get("dataset_id", ""))
            reasons["out_of_domain_dataset"] += 1
            continue
        if any(paper_id and paper_id in text for paper_id in removed_paper_ids) and not GEO_RE.search(text):
            removed_ids.add(row.get("dataset_id", ""))
            reasons["removed_paper_reference"] += 1
            continue
        kept.append(row)

    write_csv(DATA / "datasets.csv", fields, kept)
    print(f"datasets: removed {len(rows) - len(kept)} kept {len(kept)} {dict(reasons)}")
    return len(rows) - len(kept), removed_ids


def clean_benchmarks(removed_paper_ids: set[str], removed_dataset_ids: set[str]) -> int:
    fields, rows = read_csv(DATA / "benchmarks.csv")
    kept: list[dict[str, str]] = []
    reasons: Counter[str] = Counter()

    for row in rows:
        name = (row.get("dataset_name") or "").strip().lower()
        text = row_text(row)
        if row.get("paper_id") in removed_paper_ids:
            reasons["removed_paper_reference"] += 1
            continue
        if row.get("dataset_id") in removed_dataset_ids:
            reasons["removed_dataset_reference"] += 1
            continue
        if name in GENERIC_ARTIFACT_NAMES or ARTIFACT_RE.search(text):
            reasons["parser_artifact"] += 1
            continue
        if OUT_RE.search(text) and not GEO_RE.search(text):
            reasons["out_of_domain_benchmark"] += 1
            continue
        kept.append(row)

    id_counts = Counter(row.get("benchmark_id", "") for row in kept)
    seen_ids: set[str] = set()
    for row in kept:
        benchmark_id = row.get("benchmark_id", "")
        if id_counts[benchmark_id] <= 1 and benchmark_id not in seen_ids:
            seen_ids.add(benchmark_id)
            continue

        paper_suffix = slug(row.get("paper_id", ""))
        candidate = f"{benchmark_id}_{paper_suffix}"[:220].rstrip("-")
        if candidate in seen_ids:
            index = 2
            base = candidate[:210].rstrip("-")
            while f"{base}_{index}" in seen_ids:
                index += 1
            candidate = f"{base}_{index}"
        row["benchmark_id"] = candidate
        seen_ids.add(candidate)
        reasons["normalized_duplicate_id"] += 1

    write_csv(DATA / "benchmarks.csv", fields, kept)
    print(f"benchmarks: removed {len(rows) - len(kept)} kept {len(kept)} {dict(reasons)}")
    return len(rows) - len(kept)


def clean_companies() -> int:
    path = DATA / "companies.json"
    companies = json.loads(path.read_text(encoding="utf-8"))
    kept = []
    for company in companies:
        text = row_text({key: value for key, value in company.items() if not isinstance(value, (list, dict))})
        evidence = " ".join(company.get("geo_relevance_evidence") or [])
        if GEO_RE.search(text + " " + evidence):
            kept.append(company)
    path.write_text(json.dumps(kept, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"companies: removed {len(companies) - len(kept)} kept {len(kept)}")
    return len(companies) - len(kept)


def main() -> None:
    clean_models()
    _, removed_paper_ids = clean_papers()
    _, removed_dataset_ids = clean_datasets(removed_paper_ids)
    clean_benchmarks(removed_paper_ids, removed_dataset_ids)
    clean_companies()


if __name__ == "__main__":
    main()
