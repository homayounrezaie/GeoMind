#!/usr/bin/env python3
"""Recompute catalog row counts and top-10 highlights, write data/stats.json.

Run after refreshing any of the source CSVs to keep the landing-page
counts (hero stat strip + terminal explorer) in sync with the data.
"""
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "stats.json"
TOP = 10
NAME_LIMIT = 34


def read_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def read_json_list(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for value in data.values():
            if isinstance(value, list):
                return value
    return []


def trunc(name: str, limit: int = NAME_LIMIT) -> str:
    name = (name or "").strip()
    if len(name) <= limit:
        return name
    return name[: limit - 1].rstrip() + "…"


def first(row: dict, fields: list[str]) -> str:
    for field in fields:
        value = (row.get(field) or "").strip()
        if value:
            return value
    return ""


def numeric(value: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def top_names(
    rows: list[dict],
    name_fields: list[str],
    sort_field: str | None = None,
    prefer_field: str | None = None,
) -> list[str]:
    if prefer_field:
        filtered = [r for r in rows if (r.get(prefer_field) or "").strip()]
        if filtered:
            rows = filtered
    if sort_field:
        rows = sorted(rows, key=lambda r: -numeric(r.get(sort_field) or "0"))
    names: list[str] = []
    seen: set[str] = set()
    for row in rows:
        raw = first(row, name_fields)
        if not raw:
            continue
        name = trunc(raw)
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        names.append(name)
        if len(names) >= TOP:
            break
    return names


def main() -> None:
    papers = read_csv(DATA / "papers.csv")
    models = read_csv(DATA / "foundation-models.csv")
    datasets = read_csv(DATA / "datasets.csv")
    techniques = read_csv(DATA / "techniques.csv")
    tasks = read_csv(DATA / "tasks.csv")
    companies = read_json_list(DATA / "companies.json")

    counts = {
        "papers": len(papers),
        "models": len(models),
        "datasets": len(datasets),
        "techniques": len(techniques),
        "tasks": len(tasks),
        "companies": len(companies),
    }

    highlights = {
        "papers": top_names(papers, ["title"], "citation_count"),
        "models": top_names(models, ["abbreviation", "title"], "citation_count", prefer_field="abbreviation"),
        "datasets": top_names(datasets, ["name", "dataset_id"], "downloads"),
        "techniques": top_names(techniques, ["technique_name"]),
        "tasks": top_names(tasks, ["task_name"]),
        "companies": top_names(companies, ["name", "company_name"]),
    }

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    payload = {**counts, "generated_at": generated_at, "highlights": highlights}
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    summary_counts = " ".join(f"{k}={v:,}" for k, v in counts.items())
    print(f"wrote {OUT.relative_to(ROOT)}  ({summary_counts})")


if __name__ == "__main__":
    main()
