"""Consolidate dataset & benchmark leads from every source into one candidate pool.

One-time-ish consolidation aid (run while the raw sources still exist). It reads:

  * data/raw/datasets.json    + data/raw/datasets.csv     (dataset leads)
  * data/raw/benchmarks.json  + data/raw/benchmarks.csv    (benchmark leads)
  * data/_staging/datasets-*.json / benchmarks-*.json      (web-scraped leads)

Rows are normalized to a common record shape, grouped by a normalized name
(datasets) or dataset+task+metric (benchmarks), merged into one enriched
candidate per group, tagged with a "type" field (dataset|benchmark), and
written to a SINGLE combined pool: data/datasets.candidate.json. A human
promotes good candidates into data/datasets.json.

After the raw files are deleted the candidate file becomes the source of truth
and this script is retired (it has nothing left to read).
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
STAGING = DATA / "_staging"
CANDIDATES_OUT = DATA / "datasets.candidate.json"

# Tokens that mark a version/variant rather than a distinct dataset.
_VERSION_TOKEN = re.compile(
    r"(?:^|[\s_-])(?:v?\d+(?:\.\d+)*|s[12]|rgb|ms|full|train|test|val|small|tiny|mini)$"
)

# Known canonical datasets (normalized id -> seed metadata to merge in).
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


def _slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")


def _int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _clean(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


# --- dataset record extractors (each yields a common record dict) ---------


def _ds_records_from_json(path):
    rows = json.loads(path.read_text(encoding="utf-8"))
    rows = rows["datasets"] if isinstance(rows, dict) else rows
    for r in rows:
        name = _clean(r.get("dataset") or r.get("name"))
        if not name:
            continue
        yield {
            "name": name,
            "task": _clean(r.get("task")),
            "modality": _clean(r.get("sensorModality")),
            "size": _clean(r.get("sizeResolution")),
            "year": r.get("year"),
            "url": _clean(r.get("sourceUrl") or r.get("source_url")),
            "source": _clean(r.get("source")) or "raw-datasets",
            "downloads": _int(r.get("downloads")),
            "likes": _int(r.get("likes")),
            "description": _clean(r.get("description")),
        }


def _ds_records_from_csv(path):
    with path.open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            name = _clean(r.get("name") or r.get("dataset_id"))
            if not name:
                continue
            yield {
                "name": name,
                "task": _clean(r.get("task_categories") or r.get("task_ids")),
                "modality": None,
                "size": _clean(r.get("size_categories")),
                "year": None,
                "url": _clean(r.get("url")),
                "source": "Hugging Face",
                "downloads": _int(r.get("downloads")),
                "likes": _int(r.get("likes")),
                "description": _clean(r.get("description")),
            }


def _records_from_staging(path):
    """Web-scraped leads, already in the common record shape."""
    rows = json.loads(path.read_text(encoding="utf-8"))
    rows = rows.get("records", rows) if isinstance(rows, dict) else rows
    for r in rows:
        if _clean(r.get("name")):
            yield r


# --- benchmark record extractors ------------------------------------------


def _bm_records_from_json(path):
    rows = json.loads(path.read_text(encoding="utf-8"))
    rows = rows["benchmarks"] if isinstance(rows, dict) else rows
    for r in rows:
        dataset = _clean(r.get("dataset_or_challenge") or r.get("dataset_name"))
        task = _clean(r.get("task"))
        metric = _clean(r.get("metric"))
        name = _clean(r.get("benchmark")) or " - ".join(x for x in (dataset, task) if x)
        if not name:
            continue
        yield {
            "name": name, "dataset": dataset, "task": task, "metric": metric,
            "higher_is_better": None, "year": r.get("year"),
            "url": _clean(r.get("source_url")), "source": "raw-benchmarks",
            "paper_id": _clean(r.get("paper_id")),
        }


def _bm_records_from_csv(path):
    with path.open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            dataset = _clean(r.get("dataset_name"))
            task = _clean(r.get("task_name"))
            metric = _clean(r.get("metric_name"))
            name = " - ".join(x for x in (dataset, task) if x) or _clean(r.get("benchmark_id"))
            if not name:
                continue
            hib = _clean(r.get("higher_is_better"))
            yield {
                "name": name, "dataset": dataset, "task": task, "metric": metric,
                "higher_is_better": hib.lower() == "true" if hib else None,
                "year": None, "url": None, "source": "paperswithcode",
                "paper_id": _clean(r.get("paper_id")),
            }


# --- grouping / merging ----------------------------------------------------


def build_datasets(record_iters):
    groups = {}
    for records in record_iters:
        for rec in records:
            key = normalize_name(rec["name"])
            if not key:
                continue
            g = groups.get(key)
            if g is None:
                g = groups[key] = {
                    "display": rec["name"], "names": set(), "urls": set(),
                    "sources": set(), "rows": 0,
                }
            g["rows"] += 1
            g["names"].add(rec["name"])
            if rec.get("url"):
                g["urls"].add(rec["url"])
            if rec.get("source"):
                g["sources"].add(rec["source"])
            for fld in ("task", "modality", "size", "year", "description"):
                if rec.get(fld) not in (None, "", []):
                    g.setdefault(fld, rec[fld])
            for fld in ("downloads", "likes"):
                val = rec.get(fld)
                if isinstance(val, int):
                    g[fld] = max(g.get(fld) or 0, val)

    out = []
    for key in sorted(groups):
        g = groups[key]
        known = KNOWN_DATASETS.get(key, {})
        out.append({
            "id": key,
            "name": known.get("name") or g["display"],
            "known": key in KNOWN_DATASETS,
            "task": g.get("task"),
            "modality": g.get("modality"),
            "sizeResolution": g.get("size"),
            "year": g.get("year"),
            "description": g.get("description"),
            "downloads": g.get("downloads"),
            "likes": g.get("likes"),
            "sources": sorted(set(known.get("sources", [])) | g["sources"]),
            "candidate_urls": sorted(g["urls"]),
            "raw_count": g["rows"],
            "raw_names": sorted(g["names"]),
        })
    return out


def build_benchmarks(record_iters):
    groups = {}
    for records in record_iters:
        for rec in records:
            key = "::".join(
                normalize_name(rec.get(f) or "") for f in ("dataset", "task", "metric")
            )
            if key == "::::":
                key = normalize_name(rec["name"])
            if not key:
                continue
            g = groups.get(key)
            if g is None:
                g = groups[key] = {
                    "display": rec["name"], "names": set(), "urls": set(),
                    "sources": set(), "papers": set(), "rows": 0,
                }
            g["rows"] += 1
            g["names"].add(rec["name"])
            if rec.get("url"):
                g["urls"].add(rec["url"])
            if rec.get("source"):
                g["sources"].add(rec["source"])
            if rec.get("paper_id"):
                g["papers"].add(rec["paper_id"])
            for fld in ("dataset", "task", "metric", "year"):
                if rec.get(fld) not in (None, "", []):
                    g.setdefault(fld, rec[fld])
            if rec.get("higher_is_better") is not None:
                g.setdefault("higher_is_better", rec["higher_is_better"])

    out = []
    seen = {}
    for key in sorted(groups):
        g = groups[key]
        base = (
            _slug("-".join(x for x in (g.get("dataset"), g.get("task"), g.get("metric")) if x))[:90]
            or _slug(g["display"])[:90]
            or "benchmark"
        )
        seen[base] = seen.get(base, 0) + 1
        ident = base if seen[base] == 1 else f"{base}-{seen[base]}"
        out.append({
            "id": ident,
            "name": g["display"],
            "dataset": g.get("dataset"),
            "task": g.get("task"),
            "metric": g.get("metric"),
            "higher_is_better": g.get("higher_is_better"),
            "year": g.get("year"),
            "sources": sorted(g["sources"]),
            "candidate_urls": sorted(g["urls"]),
            "paper_ids": sorted(g["papers"]),
            "raw_count": g["rows"],
            "raw_names": sorted(g["names"]),
        })
    return out


def _existing(path, parser):
    return parser(path) if path.exists() else iter(())


def main():
    ds_iters = [
        _existing(RAW / "datasets.json", _ds_records_from_json),
        _existing(RAW / "datasets.csv", _ds_records_from_csv),
    ]
    bm_iters = [
        _existing(RAW / "benchmarks.json", _bm_records_from_json),
        _existing(RAW / "benchmarks.csv", _bm_records_from_csv),
    ]
    if STAGING.exists():
        for p in sorted(STAGING.glob("datasets-*.json")):
            ds_iters.append(_records_from_staging(p))
        for p in sorted(STAGING.glob("benchmarks-*.json")):
            bm_iters.append(_records_from_staging(p))

    datasets = build_datasets(ds_iters)
    benchmarks = build_benchmarks(bm_iters)
    candidates = (
        [{"type": "dataset", **d} for d in datasets]
        + [{"type": "benchmark", **b} for b in benchmarks]
    )

    # Safety: never clobber an existing candidate pool with an empty rebuild.
    # Once the raw sources are deleted this script has nothing to read, so a
    # naive run would otherwise wipe the consolidated, hand-curated file.
    if candidates:
        CANDIDATES_OUT.write_text(json.dumps({"candidates": candidates}, indent=2), encoding="utf-8")
        print(
            f"datasets.candidate.json -> {len(candidates)} candidates "
            f"({len(datasets)} datasets + {len(benchmarks)} benchmarks)"
        )
    else:
        print("no sources found; left datasets.candidate.json untouched")


if __name__ == "__main__":
    main()
