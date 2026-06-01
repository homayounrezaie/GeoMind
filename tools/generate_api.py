#!/usr/bin/env python3
"""Generate public static JSON endpoints from GeoMind source data."""
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
API = ROOT / "api"

ENDPOINTS = {
    "papers": DATA / "papers.csv",
    "models": DATA / "foundation-models.csv",
    "datasets": DATA / "datasets.csv",
    "tasks": DATA / "tasks.csv",
    "techniques": DATA / "techniques.csv",
    "metrics": DATA / "metrics.csv",
    "benchmarks": DATA / "benchmarks.csv",
    "companies": DATA / "companies.json",
}

CURATED_ENDPOINTS = ("jobs", "learn")

INTEGER_FIELDS = {
    "citation_count",
    "downloads",
    "extracted_paper_count",
    "followers",
    "founded_year",
    "likes",
    "linkedin_followers",
    "year",
}

FLOAT_FIELDS = {
    "confidence",
    "score_value",
    "trending_score",
}

BOOLEAN_FIELDS = {
    "higher_is_better",
    "uses_drones",
    "uses_gis",
    "uses_remote_sensing",
    "uses_satellite_data",
}

SEMICOLON_LIST_FIELDS = {
    "authors",
    "core_use_cases",
    "data_sources",
    "delivery_model",
    "industry_verticals",
    "main_competitors",
    "target_roles",
}

PIPE_LIST_FIELDS = {
    "languages",
    "matched_terms",
    "size_categories",
    "tags",
    "task_categories",
    "task_ids",
}


def read_csv_rows(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as fh:
        return [clean_row(row) for row in csv.DictReader(fh)]


def read_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return [clean_row(item) for item in data if isinstance(item, dict)]
    return []


def clean_row(row: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for key, raw in row.items():
        if key is None:
            continue
        key = key.strip()
        value = clean_value(key, raw)
        if value is not None:
            cleaned[key] = value
    return cleaned


def clean_value(key: str, raw: Any) -> Any:
    if isinstance(raw, list):
        items = [clean_value(key, item) for item in raw]
        return [item for item in items if item is not None]
    if not isinstance(raw, str):
        return raw

    value = raw.strip()
    if value == "":
        return None
    if key in SEMICOLON_LIST_FIELDS:
        return split_list(value, ";")
    if key in PIPE_LIST_FIELDS:
        return split_list(value, "|")
    if key in BOOLEAN_FIELDS:
        return parse_bool(value)
    if key in INTEGER_FIELDS:
        return parse_int(value)
    if key in FLOAT_FIELDS:
        return parse_float(value)
    return value


def split_list(value: str, separator: str) -> list[str]:
    return [item.strip() for item in value.split(separator) if item.strip()]


def parse_bool(value: str) -> bool | str:
    normalized = value.lower()
    if normalized in {"true", "yes", "1"}:
        return True
    if normalized in {"false", "no", "0"}:
        return False
    return value


def parse_int(value: str) -> int | str:
    try:
        return int(value)
    except ValueError:
        return value


def parse_float(value: str) -> float | str:
    try:
        return float(value)
    except ValueError:
        return value


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    API.mkdir(exist_ok=True)

    counts: dict[str, int] = {}
    for name, source in ENDPOINTS.items():
        rows = read_json_list(source) if source.suffix == ".json" else read_csv_rows(source)
        counts[name] = len(rows)
        write_json(API / f"{name}.json", rows)

    for name in CURATED_ENDPOINTS:
        path = API / f"{name}.json"
        if not path.exists():
            write_json(path, [])
        payload = json.loads(path.read_text(encoding="utf-8"))
        counts[name] = len(payload) if isinstance(payload, list) else 0

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    index = {
        "generated_at": generated_at,
        "endpoints": [
            {
                "name": name,
                "path": f"/api/{name}.json",
                "count": counts[name],
            }
            for name in sorted(counts)
        ],
    }
    write_json(API / "index.json", index)

    summary = " ".join(f"{name}={count:,}" for name, count in sorted(counts.items()))
    print(f"wrote api/*.json ({summary})")


if __name__ == "__main__":
    main()
