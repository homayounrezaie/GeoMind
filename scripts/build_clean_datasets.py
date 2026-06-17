"""Assist curation of the clean dataset index.

Reads the raw scrape at data/raw/datasets.json, collapses duplicate datasets
(e.g. the 19 BigEarthNet rows) into one group, merges a small registry of known
TorchGeo / TFDS datasets, and writes a CANDIDATE file plus a dedup report.

This is a curation aid, not the source of truth: a human reviews
data/datasets.candidate.json and promotes good entries into data/datasets.json.
"""

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "datasets.json"
CANDIDATE = ROOT / "data" / "datasets.candidate.json"

# Tokens that mark a version/variant rather than a distinct dataset.
_VERSION_TOKEN = re.compile(
    r"(?:^|[\s_-])(?:v?\d+(?:\.\d+)*|s[12]|rgb|ms|full|train|test|val|small|tiny|mini)$"
)

# Known canonical datasets (normalized id -> seed metadata to merge into candidates).
KNOWN_DATASETS = {
    "bigearthnet": {"name": "BigEarthNet", "sources": ["TorchGeo", "TFDS"]},
    "eurosat": {"name": "EuroSAT", "sources": ["TorchGeo", "TFDS"]},
    "so2sat": {"name": "So2Sat", "sources": ["TorchGeo", "TFDS"]},
    "resisc45": {"name": "RESISC45", "sources": ["TorchGeo", "TFDS"]},
    "ucmerced": {"name": "UC Merced Land Use", "sources": ["TorchGeo", "TFDS"]},
    "patternnet": {"name": "PatternNet", "sources": ["TorchGeo"]},
}


def normalize_name(name):
    """Lowercase, drop punctuation, and strip trailing version/variant tokens."""
    text = re.sub(r"[^a-z0-9\s_-]", "", str(name).lower()).strip()
    previous = None
    while text and text != previous:
        previous = text
        text = _VERSION_TOKEN.sub("", text).strip()
    return re.sub(r"[\s_-]+", "", text)


def _raw_name(row):
    return row.get("dataset") or row.get("name") or ""


def group_datasets(rows):
    """Group raw rows by normalized name. Returns {normalized_id: [rows...]}."""
    groups = defaultdict(list)
    for row in rows:
        key = normalize_name(_raw_name(row))
        if key:
            groups[key].append(row)
    return dict(groups)


def build_candidates(groups):
    candidates = []
    for key in sorted(groups):
        rows = groups[key]
        known = KNOWN_DATASETS.get(key, {})
        urls = sorted({r.get("sourceUrl") or r.get("source_url") for r in rows if r.get("sourceUrl") or r.get("source_url")})
        candidates.append(
            {
                "id": key,
                "name": known.get("name") or _raw_name(rows[0]),
                "known": key in KNOWN_DATASETS,
                "raw_count": len(rows),
                "raw_names": sorted({_raw_name(r) for r in rows}),
                "candidate_urls": urls,
                "sources": known.get("sources", []),
            }
        )
    return candidates


def main():
    rows = json.loads(RAW.read_text(encoding="utf-8"))
    rows = rows["datasets"] if isinstance(rows, dict) else rows
    groups = group_datasets(rows)
    candidates = build_candidates(groups)
    CANDIDATE.write_text(json.dumps({"datasets": candidates}, indent=2), encoding="utf-8")

    collapsed = sorted(
        ((c["id"], c["raw_count"]) for c in candidates if c["raw_count"] > 1),
        key=lambda pair: -pair[1],
    )
    print(f"{len(rows)} raw rows -> {len(candidates)} unique datasets")
    print(f"Wrote {CANDIDATE.relative_to(ROOT)}")
    print("Top collapsed duplicates:")
    for an_id, count in collapsed[:15]:
        print(f"  {count:3d}x  {an_id}")


if __name__ == "__main__":
    main()
