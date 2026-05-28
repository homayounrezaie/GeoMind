#!/usr/bin/env python3
"""Recompute catalog row counts and write data/stats.json.

Run after refreshing any of the source CSVs to keep the landing-page
counts (hero stat strip + terminal explorer) in sync with the data.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "stats.json"

SOURCES = {
    "papers": DATA / "papers.csv",
    "models": DATA / "foundation-models.csv",
    "datasets": DATA / "datasets.csv",
    "companies": DATA / "companies.json",
}


def count_rows(path: Path) -> int:
    if not path.exists():
        return 0
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return len(data)
        if isinstance(data, dict):
            for value in data.values():
                if isinstance(value, list):
                    return len(value)
        return 0
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        next(reader, None)  # skip header
        return sum(1 for _ in reader)


def main() -> None:
    stats = {key: count_rows(path) for key, path in SOURCES.items()}
    OUT.write_text(json.dumps(stats, indent=2) + "\n", encoding="utf-8")
    summary = " ".join(f"{k}={v:,}" for k, v in stats.items())
    print(f"wrote {OUT.relative_to(ROOT)}  ({summary})")


if __name__ == "__main__":
    main()
