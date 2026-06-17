# Dataset Pages & Clean Dataset Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the noisy, scraped dataset list with a clean, deduplicated `data/datasets.json` (one canonical entry per dataset, all versions consolidated) and give each dataset a paper-style detail page rendered by `js/site.js`.

**Architecture:** This is a static site — HTML shells + one vanilla-JS file (`js/site.js`) + JSON data, no build step. We add (1) a clean dataset schema and seed data, (2) a Python builder/dedup script + tests to assist curation from the existing raw scrape, (3) new JS render functions (`renderDatasetCard` and helpers) that mirror the existing `renderPaperCard`, reusing the `paper-card-*` CSS, (4) a thin `pages/dataset.html` shell, (5) CSS for the new Details/Versions blocks, and (6) wiring so dataset rows in the combined list link **internally** to `dataset.html?id=...` (benchmark rows are unchanged).

**Tech Stack:** Vanilla JS (browser, no framework), HTML, CSS (custom-property tokens), JSON data files. Tests: Python `unittest` (stdlib) for the data layer; Node 22 built-in test runner (`node --test`) with `vm` for pure JS helpers; `node --check` as a parse gate; manual browser smoke test via `python3 -m http.server`.

**Decisions locked (from brainstorming):**
- Scope: build the system **and** seed a first batch (~12 canonical datasets, BigEarthNet as the worked multi-version example). Full-catalog curation is a later pass.
- Datasets only — benchmarks stay on the existing combined list unchanged.
- Page layout: a **Details** facts block + **Versions** list above a **Links** chip row.
- Data sourcing: **script-assisted curation** — a Python script dedupes the raw scrape and merges a known-dataset registry into a *candidate* file; a human promotes curated entries into `data/datasets.json`.

---

## File Structure

**Created:**
- `data/datasets.json` — the clean, committed dataset index. Shape: `{ "datasets": [ {entry}, ... ] }`. One entry per dataset; multiple versions live inside one entry's `versions` array.
- `pages/dataset.html` — thin shell for the dataset detail page (mirrors `pages/paper.html`), reusing `paper-card-*` CSS.
- `scripts/build_clean_datasets.py` — dedup/curation helper: reads `data/raw/datasets.json`, collapses duplicates (e.g. BigEarthNet ×19 → 1), merges a known-dataset registry, writes `data/datasets.candidate.json` + a stdout report.
- `scripts/test_build_clean_datasets.py` — `unittest` for the dedup core.
- `scripts/test_clean_datasets.py` — `unittest` validating the committed `data/datasets.json` (schema, uniqueness, valid URLs, BigEarthNet-once, version structure).
- `scripts/site.test.mjs` — Node `--test` unit tests for the new pure JS helper `getDatasetItems`, loaded via `vm`.

**Modified:**
- `js/site.js` — add: link metadata for dataset link types (`paperResourceMeta`); `getDatasetItems`, `getDatasetLead`, `appendDatasetDetails`, `appendDatasetVersions`, `renderDatasetCard`, `initDatasetCardPage`, and an auto-init line; change `normalizeCombinedResource` + `createCombinedResourceRow` so dataset rows link internally.
- `pages/datasets.html` — bump `style.css`/`site.js` cache-bust query strings.

**Reused as-is (do not modify):** `appendPaperLinks`, `getPaperLinkEntries`, `getPaperResourceMeta`, `createSaveButton`, `createResourceEditButton`, `appendText`, `setupExpandableAbstract`, `hasResourceValue`, `setResourceRowLink`, `bindResourceRowLinks`.

### Clean dataset entry schema

```jsonc
{
  "id": "bigearthnet",                       // required, unique, kebab-case slug; used in dataset.html?id=
  "name": "BigEarthNet",                     // required, display name
  "summary": "One-line summary.",            // required, shown as the lead under the title
  "description": "Full paragraph overview.", // required, shown in the Overview section (expandable)
  "task": "Multi-label land-cover classification", // shown in Details
  "modality": "Sentinel-1 SAR / Sentinel-2 MSI",   // shown in Details
  "size": "≈66 GB",                          // optional, shown in Details
  "numSamples": "590,326 patches",           // optional, shown in Details
  "license": "CDLA-Permissive-1.0",          // optional, shown in Details
  "year": 2019,                              // optional, shown in Details + used for list sort
  "sources": ["TorchGeo", "TFDS"],           // optional provenance tags (not rendered yet)
  "versions": [                              // optional; if present, rendered as a Versions list
    { "name": "v1.0", "year": 2019, "size": "≈66 GB", "numSamples": "590,326 patches", "url": "https://..." },
    { "name": "v2.0 (reBEN)", "year": 2024, "size": "≈55 GB", "numSamples": "549,488 patches", "url": "https://..." }
  ],
  "links": {                                 // required, non-empty; every value must be an http(s) URL
    "paper": "https://arxiv.org/abs/1902.06148",
    "homepage": "https://bigearth.net/",
    "tfds": "https://www.tensorflow.org/datasets/catalog/bigearthnet",
    "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#bigearthnet"
  }
}
```

Link keys rendered with nice labels/icons: `paper`, `homepage`, `download`, `tfds`, `torchgeo`, `huggingface`, plus everything already in `paperResourceMeta` (`code`, `arxiv`, `project_page`, …). Unknown keys still render with a default globe icon and a title-cased label.

---

## Task 1: Clean dataset file + schema-validation test (BigEarthNet seed)

**Files:**
- Create: `data/datasets.json`
- Create: `scripts/test_clean_datasets.py`

- [ ] **Step 1: Write the failing test**

Create `scripts/test_clean_datasets.py`:

```python
import json
import re
import unittest
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "datasets.json"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HTTP = re.compile(r"^https?://", re.IGNORECASE)
REQUIRED = ("id", "name", "summary", "description", "task", "links")


def load_datasets():
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    return payload["datasets"] if isinstance(payload, dict) else payload


class CleanDatasetsTest(unittest.TestCase):
    def setUp(self):
        self.datasets = load_datasets()

    def test_file_is_nonempty_list(self):
        self.assertIsInstance(self.datasets, list)
        self.assertGreater(len(self.datasets), 0)

    def test_required_fields_present(self):
        for item in self.datasets:
            for field in REQUIRED:
                self.assertTrue(item.get(field), f"{item.get('id')!r} missing {field}")

    def test_ids_unique_and_slugged(self):
        ids = [item["id"] for item in self.datasets]
        self.assertEqual(len(ids), len(set(ids)), "duplicate ids")
        for an_id in ids:
            self.assertRegex(an_id, SLUG, f"{an_id!r} is not a kebab-case slug")

    def test_links_are_http_urls(self):
        for item in self.datasets:
            self.assertIsInstance(item["links"], dict)
            self.assertGreater(len(item["links"]), 0, f"{item['id']} has no links")
            for key, value in item["links"].items():
                self.assertRegex(str(value), HTTP, f"{item['id']}.links.{key} is not a URL")

    def test_versions_well_formed(self):
        for item in self.datasets:
            versions = item.get("versions")
            if versions is None:
                continue
            self.assertIsInstance(versions, list)
            for version in versions:
                self.assertTrue(version.get("name"), f"{item['id']} version missing name")
                if version.get("url"):
                    self.assertRegex(str(version["url"]), HTTP)

    def test_bigearthnet_exists_once_with_versions(self):
        be = [d for d in self.datasets if "bigearthnet" in d["id"]]
        self.assertEqual(len(be), 1, "BigEarthNet must appear exactly once")
        self.assertGreaterEqual(len(be[0].get("versions", [])), 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest scripts.test_clean_datasets -v` (from repo root)
Expected: FAIL — `FileNotFoundError` / errors because `data/datasets.json` does not exist yet.

- [ ] **Step 3: Create `data/datasets.json` with the BigEarthNet seed**

```json
{
  "datasets": [
    {
      "id": "bigearthnet",
      "name": "BigEarthNet",
      "summary": "Large-scale Sentinel-1/Sentinel-2 benchmark for multi-label land-cover classification.",
      "description": "BigEarthNet is a large-scale benchmark archive of Sentinel-1 and Sentinel-2 image patches annotated with multiple land-cover labels from the CORINE Land Cover map. It was designed to support deep learning for remote sensing image understanding at scale. Version 1.0 provides 590,326 Sentinel-2 patches; the 2024 reBEN (v2.0) release refines the label nomenclature and geographic splits and provides 549,488 patches with paired Sentinel-1 and Sentinel-2 data.",
      "task": "Multi-label land-cover classification",
      "modality": "Sentinel-1 SAR / Sentinel-2 multispectral",
      "size": "≈66 GB (Sentinel-2)",
      "numSamples": "590,326 patches (v1.0)",
      "license": "CDLA-Permissive-1.0",
      "year": 2019,
      "sources": ["TorchGeo", "TFDS"],
      "versions": [
        {
          "name": "v1.0",
          "year": 2019,
          "size": "≈66 GB (Sentinel-2)",
          "numSamples": "590,326 patches",
          "url": "https://www.tensorflow.org/datasets/catalog/bigearthnet"
        },
        {
          "name": "v2.0 (reBEN)",
          "year": 2024,
          "size": "≈55 GB",
          "numSamples": "549,488 patches",
          "url": "https://bigearth.net/"
        }
      ],
      "links": {
        "paper": "https://arxiv.org/abs/1902.06148",
        "homepage": "https://bigearth.net/",
        "tfds": "https://www.tensorflow.org/datasets/catalog/bigearthnet",
        "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#bigearthnet"
      }
    }
  ]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest scripts.test_clean_datasets -v`
Expected: PASS — all six tests OK.

- [ ] **Step 5: Commit**

```bash
git add data/datasets.json scripts/test_clean_datasets.py
git commit -m "feat(datasets): add clean dataset index with BigEarthNet seed + schema test"
```

---

## Task 2: Dedup/curation builder script + test

**Files:**
- Create: `scripts/build_clean_datasets.py`
- Create: `scripts/test_build_clean_datasets.py`

- [ ] **Step 1: Write the failing test**

Create `scripts/test_build_clean_datasets.py`:

```python
import unittest

from build_clean_datasets import group_datasets, normalize_name


class NormalizeNameTest(unittest.TestCase):
    def test_strips_case_punctuation_and_version_tokens(self):
        self.assertEqual(normalize_name("BigEarthNet"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet-S2"), "bigearthnet")
        self.assertEqual(normalize_name("bigearthnet_v2"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet S1"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet v1.0 (full)"), "bigearthnet")


class GroupDatasetsTest(unittest.TestCase):
    def test_collapses_bigearthnet_variants_to_one_group(self):
        raw = [
            {"dataset": "BigEarthNet", "sourceUrl": "https://a"},
            {"dataset": "BigEarthNet-S2", "sourceUrl": "https://b"},
            {"dataset": "bigearthnet_v2", "sourceUrl": "https://c"},
            {"dataset": "BigEarthNet S1", "sourceUrl": "https://d"},
            {"dataset": "EuroSAT", "sourceUrl": "https://e"},
        ]
        groups = group_datasets(raw)
        self.assertIn("bigearthnet", groups)
        self.assertEqual(len(groups["bigearthnet"]), 4)
        self.assertIn("eurosat", groups)
        self.assertEqual(len(groups["eurosat"]), 1)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_build_clean_datasets -v` (run from inside `scripts/`: `cd scripts && python3 -m unittest test_build_clean_datasets -v`)
Expected: FAIL — `ModuleNotFoundError: No module named 'build_clean_datasets'`.

- [ ] **Step 3: Write `scripts/build_clean_datasets.py`**

```python
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd scripts && python3 -m unittest test_build_clean_datasets -v && cd ..`
Expected: PASS — both test classes OK.

- [ ] **Step 5: Run the builder against the real raw data (sanity check)**

Run: `python3 scripts/build_clean_datasets.py`
Expected: prints a row-count → unique-count reduction and a "Top collapsed duplicates" list that includes `bigearthnet` with a count > 1; writes `data/datasets.candidate.json`.

- [ ] **Step 6: Ignore the candidate artifact**

Add to `.gitignore` (the candidate file is a local curation aid, not committed):

```
data/datasets.candidate.json
```

- [ ] **Step 7: Commit**

```bash
git add scripts/build_clean_datasets.py scripts/test_build_clean_datasets.py .gitignore
git commit -m "feat(datasets): add dedup/curation builder script + tests"
```

---

## Task 3: Seed the first batch of clean datasets

**Files:**
- Modify: `data/datasets.json`

Add the following entries to the `datasets` array (BigEarthNet is already present from Task 1). These six are fully specified with verified canonical values. Two of them (EuroSAT, So2Sat) demonstrate multi-version consolidation.

- [ ] **Step 1: Add EuroSAT, So2Sat, RESISC45, UC Merced, PatternNet**

Insert these objects into the `datasets` array (after the BigEarthNet entry, comma-separated):

```json
{
  "id": "eurosat",
  "name": "EuroSAT",
  "summary": "Sentinel-2 land-use/land-cover classification benchmark with 10 classes.",
  "description": "EuroSAT is a land-use and land-cover classification dataset based on Sentinel-2 satellite images covering 13 spectral bands. It consists of 27,000 labelled and geo-referenced 64×64 patches across 10 classes. It is distributed in two variants: an RGB-only version and a full 13-band multispectral version.",
  "task": "Land-use / land-cover classification",
  "modality": "Sentinel-2 multispectral",
  "size": "≈2 GB (all bands)",
  "numSamples": "27,000 images / 10 classes",
  "license": "MIT",
  "year": 2019,
  "sources": ["TorchGeo", "TFDS"],
  "versions": [
    { "name": "RGB", "year": 2019, "size": "≈90 MB", "numSamples": "27,000 images", "url": "https://www.tensorflow.org/datasets/catalog/eurosat" },
    { "name": "All bands (13-band)", "year": 2019, "size": "≈2 GB", "numSamples": "27,000 images", "url": "https://www.tensorflow.org/datasets/catalog/eurosat" }
  ],
  "links": {
    "paper": "https://arxiv.org/abs/1709.00029",
    "homepage": "https://github.com/phelber/EuroSAT",
    "tfds": "https://www.tensorflow.org/datasets/catalog/eurosat",
    "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#eurosat"
  }
},
{
  "id": "so2sat",
  "name": "So2Sat LCZ42",
  "summary": "Sentinel-1/2 benchmark for Local Climate Zone classification over 42 cities.",
  "description": "So2Sat LCZ42 is a benchmark dataset of co-registered Sentinel-1 and Sentinel-2 image patches over 42 urban agglomerations, hand-labelled into 17 Local Climate Zone (LCZ) classes. It is provided with multiple train/validation/test splits.",
  "task": "Local Climate Zone classification",
  "modality": "Sentinel-1 SAR / Sentinel-2 multispectral",
  "size": "≈55 GB",
  "numSamples": "≈400,000 patches / 17 classes",
  "license": "CC-BY-4.0",
  "year": 2020,
  "sources": ["TorchGeo", "TFDS"],
  "versions": [
    { "name": "Random split", "year": 2020, "url": "https://www.tensorflow.org/datasets/catalog/so2sat" },
    { "name": "Block split (v2)", "year": 2020, "url": "https://www.tensorflow.org/datasets/catalog/so2sat" }
  ],
  "links": {
    "paper": "https://arxiv.org/abs/1912.12171",
    "tfds": "https://www.tensorflow.org/datasets/catalog/so2sat",
    "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#so2sat"
  }
},
{
  "id": "resisc45",
  "name": "RESISC45",
  "summary": "NWPU aerial scene classification benchmark with 45 classes.",
  "description": "RESISC45 (NWPU-RESISC45) is a publicly available benchmark for remote sensing image scene classification, containing 31,500 aerial images of 256×256 pixels across 45 scene classes with 700 images per class.",
  "task": "Scene classification",
  "modality": "Aerial RGB imagery",
  "size": "≈400 MB",
  "numSamples": "31,500 images / 45 classes",
  "license": "Research use only",
  "year": 2017,
  "sources": ["TorchGeo", "TFDS"],
  "links": {
    "paper": "https://arxiv.org/abs/1703.00121",
    "tfds": "https://www.tensorflow.org/datasets/catalog/resisc45",
    "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#resisc45"
  }
},
{
  "id": "uc-merced",
  "name": "UC Merced Land Use",
  "summary": "Classic 21-class aerial land-use scene classification dataset.",
  "description": "The UC Merced Land Use dataset is a 21-class land-use image classification dataset of 256×256-pixel aerial images extracted from USGS imagery, with 100 images per class for a total of 2,100 images. It is widely used as a small-scale scene-classification benchmark.",
  "task": "Land-use scene classification",
  "modality": "Aerial RGB imagery",
  "size": "≈320 MB",
  "numSamples": "2,100 images / 21 classes",
  "license": "Public domain (USGS)",
  "year": 2010,
  "sources": ["TorchGeo", "TFDS"],
  "links": {
    "paper": "https://dl.acm.org/doi/10.1145/1869790.1869829",
    "homepage": "http://weegee.vision.ucmerced.edu/datasets/landuse.html",
    "tfds": "https://www.tensorflow.org/datasets/catalog/uc_merced",
    "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#ucmerced"
  }
},
{
  "id": "patternnet",
  "name": "PatternNet",
  "summary": "High-resolution remote sensing image retrieval/classification benchmark, 38 classes.",
  "description": "PatternNet is a large-scale high-resolution remote sensing dataset collected for image retrieval, containing 30,400 images of 256×256 pixels across 38 classes with 800 images per class.",
  "task": "Scene classification / image retrieval",
  "modality": "Aerial RGB imagery",
  "size": "≈1.4 GB",
  "numSamples": "30,400 images / 38 classes",
  "license": "Research use only",
  "year": 2018,
  "sources": ["TorchGeo"],
  "links": {
    "paper": "https://arxiv.org/abs/1706.03424",
    "torchgeo": "https://torchgeo.readthedocs.io/en/stable/api/datasets.html#patternnet"
  }
}
```

- [ ] **Step 2: Validate the file parses and passes the schema test**

Run: `python3 -m json.tool data/datasets.json > /dev/null && python3 -m unittest scripts.test_clean_datasets -v`
Expected: JSON parses (no output from `json.tool`) and all schema tests PASS with 6 datasets.

- [ ] **Step 3: Curate the remaining batch (6 more datasets)**

For each dataset below, open its cited pages, then add one entry following the **exact schema and field names** used above (`id`, `name`, `summary`, `description`, `task`, `modality`, `size`, `numSamples`, `license`, `year`, `sources`, optional `versions`, `links`). Fill `size`/`numSamples`/`description` with values read from the cited pages (do **not** invent numbers — copy them). Use the dedup report from Task 2 Step 5 to confirm you are not re-introducing a duplicate.

1. **LEVIR-CD** — `id: "levir-cd"`, task "Change detection", modality "Aerial RGB imagery". Links: `paper` https://www.mdpi.com/2072-4292/12/10/1662 , `homepage` https://chenhao.in/LEVIR/ , `torchgeo` https://torchgeo.readthedocs.io/en/stable/api/datasets.html#levir-cd
2. **SpaceNet** — `id: "spacenet"`, task "Building/road extraction". Use `versions` for the SpaceNet challenges. Links: `homepage` https://spacenet.ai/ , `torchgeo` https://torchgeo.readthedocs.io/en/stable/api/datasets.html#spacenet
3. **Chesapeake Land Cover** — `id: "chesapeake-land-cover"`, task "Semantic segmentation". Links: `homepage` https://lila.science/datasets/chesapeakelandcover , `torchgeo` https://torchgeo.readthedocs.io/en/stable/api/datasets.html#chesapeake
4. **ISPRS Potsdam** — `id: "isprs-potsdam"`, task "Semantic segmentation". Links: `homepage` https://www.isprs.org/education/benchmarks/UrbanSemLab/2d-sem-label-potsdam.aspx , `torchgeo` https://torchgeo.readthedocs.io/en/stable/api/datasets.html#potsdam
5. **ISPRS Vaihingen** — `id: "isprs-vaihingen"`, task "Semantic segmentation". Links: `homepage` https://www.isprs.org/education/benchmarks/UrbanSemLab/2d-sem-label-vaihingen.aspx , `torchgeo` https://torchgeo.readthedocs.io/en/stable/api/datasets.html#vaihingen
6. **Tropical Cyclone** — `id: "tropical-cyclone"`, task "Wind-speed estimation (regression)", modality "Geostationary satellite imagery". Links: `homepage` https://mlhub.earth/ , `torchgeo` https://torchgeo.readthedocs.io/en/stable/api/datasets.html#tropical-cyclone

- [ ] **Step 4: Re-validate after adding the batch**

Run: `python3 -m json.tool data/datasets.json > /dev/null && python3 -m unittest scripts.test_clean_datasets -v`
Expected: PASS with 12 datasets; `test_ids_unique_and_slugged` confirms no duplicate ids.

- [ ] **Step 5: Commit**

```bash
git add data/datasets.json
git commit -m "feat(datasets): seed first batch of 12 clean datasets"
```

---

## Task 4: Add dataset link types to `paperResourceMeta`

**Files:**
- Modify: `js/site.js` (the `paperResourceMeta` object ends at line ~955, just before `const hiddenPaperCardLinkKeys`)

- [ ] **Step 1: Add the new link metadata entries**

In `js/site.js`, find the closing of the `project_page` entry inside `paperResourceMeta` (around line 954):

```js
  project_page: {
    label: "Project page",
    order: 12,
    icon: [
      '<circle cx="12" cy="12" r="10"/>',
      '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>',
      '<path d="M2 12h20"/>',
    ],
  },
};
```

Replace that closing (`  },\n};`) so the new entries are added before the final `};`:

```js
  project_page: {
    label: "Project page",
    order: 12,
    icon: [
      '<circle cx="12" cy="12" r="10"/>',
      '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>',
      '<path d="M2 12h20"/>',
    ],
  },
  paper: {
    label: "Paper",
    order: 3,
    icon: [
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>',
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
      '<path d="M10 9H8"/>',
      '<path d="M16 13H8"/>',
      '<path d="M16 17H8"/>',
    ],
  },
  homepage: {
    label: "Homepage",
    order: 8,
    icon: [
      '<circle cx="12" cy="12" r="10"/>',
      '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>',
      '<path d="M2 12h20"/>',
    ],
  },
  download: {
    label: "Download",
    order: 8.5,
    icon: [
      '<path d="M12 3v12"/>',
      '<path d="m7 10 5 5 5-5"/>',
      '<path d="M5 21h14"/>',
    ],
  },
  tfds: {
    label: "TensorFlow Datasets",
    order: 13,
    icon: [
      '<ellipse cx="12" cy="5" rx="9" ry="3"/>',
      '<path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
      '<path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    ],
  },
  torchgeo: {
    label: "TorchGeo",
    order: 14,
    icon: [
      '<ellipse cx="12" cy="5" rx="9" ry="3"/>',
      '<path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
      '<path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    ],
  },
  huggingface: {
    label: "Hugging Face",
    order: 15,
    iconImage: "../images/huggingface-logo.svg",
  },
};
```

> Note: adding a `paper` entry also gives the existing `links.paper` field on paper cards a document icon and `order: 3` (between arXiv and Code). This is a benign visual improvement; Step 3 verifies paper pages still render.

- [ ] **Step 2: Verify the file still parses**

Run: `node --check js/site.js`
Expected: no output, exit code 0 (PARSE OK).

- [ ] **Step 3: Manually verify a paper page still renders its links**

Run: `python3 -m http.server 8000` (from repo root; leave running), then open `http://localhost:8000/pages/paper.html?id=real-noise-decoupling-for-hyperspectral-image-denoising-2026` in a browser.
Expected: the Links section still shows PDF / arXiv / Code chips with no console errors. Stop the server with Ctrl-C when done.

- [ ] **Step 4: Commit**

```bash
git add js/site.js
git commit -m "feat(datasets): add paper/homepage/download/tfds/torchgeo/huggingface link types"
```

---

## Task 5: Add `getDatasetItems` / `getDatasetLead` + Node unit test

**Files:**
- Modify: `js/site.js` (add helpers near `getPaperItems`, which ends at line ~1393)
- Create: `scripts/site.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/site.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../js/site.js", import.meta.url), "utf8");
const noop = () => {};
const mediaQuery = { matches: false, addEventListener: noop, removeEventListener: noop };
const context = {
  document: {
    currentScript: { src: "file:///site.js" },
    addEventListener: noop,
    querySelectorAll: () => [],
  },
  window: {
    location: { href: "http://localhost/" },
    matchMedia: () => mediaQuery,
    addEventListener: noop,
  },
  console,
};
vm.createContext(context);
vm.runInContext(code, context);

test("getDatasetItems unwraps the {datasets} envelope", () => {
  assert.deepEqual(context.getDatasetItems({ datasets: [{ id: "a" }] }), [{ id: "a" }]);
});

test("getDatasetItems passes a bare array through", () => {
  assert.deepEqual(context.getDatasetItems([{ id: "a" }]), [{ id: "a" }]);
});

test("getDatasetItems returns [] for empty/unknown payloads", () => {
  assert.deepEqual(context.getDatasetItems({}), []);
  assert.deepEqual(context.getDatasetItems(null), []);
});

test("getDatasetLead prefers summary", () => {
  assert.equal(context.getDatasetLead({ summary: "S", description: "D" }), "S");
  assert.equal(context.getDatasetLead({ description: "D" }), "");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/site.test.mjs`
Expected: FAIL — `getDatasetItems`/`getDatasetLead` are `undefined` (not yet defined), assertions throw.

- [ ] **Step 3: Add the helpers**

In `js/site.js`, immediately after `getPaperItems` (ends ~line 1393):

```js
function getPaperItems(payload) {
  return Array.isArray(payload) ? payload : payload.items || payload.papers || [];
}
```

add:

```js
function getDatasetItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.datasets || payload?.items || [];
}

function getDatasetLead(data) {
  return [data?.summary, data?.one_line_summary].find(hasResourceValue) || "";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/site.test.mjs`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Verify the file still parses**

Run: `node --check js/site.js`
Expected: PARSE OK.

- [ ] **Step 6: Commit**

```bash
git add js/site.js scripts/site.test.mjs
git commit -m "feat(datasets): add getDatasetItems/getDatasetLead + node unit tests"
```

---

## Task 6: `pages/dataset.html` shell

**Files:**
- Create: `pages/dataset.html`

- [ ] **Step 1: Create the page**

Create `pages/dataset.html` (header copied verbatim from `pages/datasets.html` so nav/markup match; Datasets nav item marked active):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dataset - GeoMind</title>
    <link rel="icon" type="image/png" href="../images/geomind-logo.png" />
    <link rel="stylesheet" href="../css/style.css?v=20260617-1" />
    <link rel="stylesheet" href="../css/paper-icons.css?v=20260611-1" />
  </head>
  <body>
    <header class="site-header resource-site-header">
      <button class="menu-button" type="button" aria-label="Open navigation">
        <span></span>
      </button>
      <a class="brand" href="../" aria-label="GeoMind home">
        <img src="../images/geomind-logo.png" alt="" />
        <span>GeoMind</span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="papers.html">Papers with Code</a>
        <a href="models.html">Models</a>
        <a class="is-active" href="datasets.html" aria-current="page">Datasets &amp; Benchmarks</a>
      </nav>
      <button class="header-user-button" type="button" aria-label="User" data-tooltip="User">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M4 21a8 8 0 0 1 16 0"></path>
        </svg>
      </button>
    </header>

    <main class="paper-card-page" data-dataset-card data-dataset-source="../data/datasets.json?v=20260617-1">
      <p class="paper-card-loading">Loading dataset card</p>
    </main>
    <script src="../js/site.js?v=20260617-1"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify the page loads (still shows "Dataset not found." until Task 7)**

Run: `python3 -m http.server 8000` (leave running), open `http://localhost:8000/pages/dataset.html?id=bigearthnet`.
Expected: page loads, header renders; the main area shows "Dataset not found." (the render function does not exist yet — this is expected and confirms `initDatasetCardPage` will be wired next). No JS errors other than the missing-render behavior. Stop the server when done.

- [ ] **Step 3: Commit**

```bash
git add pages/dataset.html
git commit -m "feat(datasets): add dataset detail page shell"
```

---

## Task 7: Render the dataset card

**Files:**
- Modify: `js/site.js` (add render functions near `renderPaperCard`/`initPaperCardPage`, and an auto-init line next to the existing `[data-paper-card]` init at line ~3317)

- [ ] **Step 1: Add the render + init functions**

In `js/site.js`, after `initPaperCardPage` and its auto-init line (line ~3317: `document.querySelectorAll("[data-paper-card]").forEach(initPaperCardPage);`), append:

```js
const DATASET_DETAIL_FIELDS = [
  ["task", "Task"],
  ["modality", "Modality"],
  ["size", "Size"],
  ["numSamples", "Samples"],
  ["license", "License"],
  ["year", "Year"],
];

function appendDatasetVersions(parent, versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return 0;
  }

  const wrap = document.createElement("div");
  const heading = document.createElement("h3");

  wrap.className = "dataset-versions";
  heading.className = "dataset-versions-heading";
  heading.textContent = "Versions";
  wrap.append(heading);

  versions.forEach((version) => {
    const hasUrl = isValidResourceUrl(version.url);
    const item = document.createElement(hasUrl ? "a" : "div");
    const name = document.createElement("span");
    const metaText = [version.size, version.numSamples].filter(hasResourceValue).join(" · ");

    item.className = "dataset-version";
    if (hasUrl) {
      item.href = String(version.url).trim();
      item.target = "_blank";
      item.rel = "noreferrer";
    }
    name.className = "dataset-version-name";
    name.textContent = [version.name, version.year].filter(hasResourceValue).join(" · ");
    item.append(name);
    if (metaText) {
      const meta = document.createElement("span");
      meta.className = "dataset-version-meta";
      meta.textContent = metaText;
      item.append(meta);
    }
    wrap.append(item);
  });

  parent.append(wrap);
  return versions.length;
}

function appendDatasetDetails(parent, data) {
  const rows = DATASET_DETAIL_FIELDS.filter(([key]) => hasResourceValue(data[key])).map(
    ([key, label]) => [label, String(data[key])]
  );
  const hasVersions = Array.isArray(data.versions) && data.versions.length > 0;

  if (!rows.length && !hasVersions) {
    return 0;
  }

  if (rows.length) {
    const list = document.createElement("dl");

    list.className = "dataset-detail-list";
    rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      const desc = document.createElement("dd");

      term.className = "dataset-detail-term";
      desc.className = "dataset-detail-value";
      term.textContent = label;
      desc.textContent = value;
      list.append(term, desc);
    });
    parent.append(list);
  }

  appendDatasetVersions(parent, data.versions);
  return rows.length + (hasVersions ? 1 : 0);
}

function renderDatasetCard(container, data) {
  const article = document.createElement("article");
  const hero = document.createElement("header");
  const topbar = document.createElement("div");
  const closeLink = document.createElement("a");
  const titleRow = document.createElement("div");
  const title = document.createElement("h1");
  const body = document.createElement("div");
  const saveButton = createSaveButton({
    type: "dataset",
    id: data.id,
    title: data.name,
    url: window.location.href,
  });
  const leadText = getDatasetLead(data);

  document.title = `${data.name || "Dataset"} - GeoMind`;

  article.className = "paper-card-article";
  hero.className = "paper-card-hero";
  topbar.className = "paper-card-topbar";
  titleRow.className = "paper-card-title-row";
  closeLink.className = "paper-card-close";
  closeLink.href = "datasets.html";
  closeLink.setAttribute("aria-label", "Close dataset card");
  closeLink.title = "Close";
  title.textContent = data.name || "Dataset";
  topbar.append(closeLink);
  titleRow.append(title);
  hero.append(topbar, titleRow);

  if (hasResourceValue(leadText)) {
    const lead = document.createElement("p");

    lead.className = "paper-card-lead";
    lead.textContent = String(leadText);
    hero.append(lead);
  }

  body.className = "paper-card-body";

  if (hasResourceValue(data.description)) {
    const overview = document.createElement("section");
    const heading = document.createElement("h2");

    overview.className = "paper-card-section paper-card-abstract";
    heading.textContent = "Overview";
    overview.append(heading);
    setupExpandableAbstract(overview, appendText(overview, data.description));
    body.append(overview);
  }

  {
    const details = document.createElement("section");
    const headingRow = document.createElement("div");
    const heading = document.createElement("h2");
    const headingActions = document.createElement("div");

    details.className = "paper-card-section dataset-card-details";
    headingRow.className = "paper-card-section-head";
    headingActions.className = "paper-card-section-actions";
    heading.textContent = "Details";
    headingRow.append(heading);
    headingActions.append(saveButton);
    headingRow.append(headingActions);
    details.append(headingRow);
    appendDatasetDetails(details, data);
    body.append(details);
  }

  {
    const links = document.createElement("section");
    const linksHeadingRow = document.createElement("div");
    const linksHeading = document.createElement("h2");
    const linksRow = document.createElement("div");
    const linkList = document.createElement("div");

    links.className = "paper-card-section paper-card-resources";
    linksHeadingRow.className = "paper-card-section-head";
    linksRow.className = "paper-card-links-row";
    linksHeading.textContent = "Links";
    linkList.className = "paper-card-links";
    linksHeadingRow.append(
      linksHeading,
      createResourceEditButton({
        type: "dataset",
        id: data.id,
        title: data.name,
        url: window.location.href,
        links: data.links,
      })
    );
    links.append(linksHeadingRow);
    appendPaperLinks(linkList, data.links);
    linksRow.append(linkList);
    links.append(linksRow);
    body.append(links);
  }

  article.append(hero, body);
  container.replaceChildren(article);
}

async function initDatasetCardPage(container) {
  const source = container.dataset.datasetSource || "../data/datasets.json";
  const params = new URLSearchParams(window.location.search);
  const datasetId = params.get("id") || "";

  if (!datasetId) {
    container.textContent = "Dataset not found.";
    return;
  }

  try {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(`Unable to load ${source}`);
    }

    const payload = await response.json();
    const dataset = getDatasetItems(payload).find((item) => String(item.id) === datasetId);

    if (!dataset) {
      container.textContent = "Dataset not found.";
      return;
    }

    renderDatasetCard(container, dataset);
  } catch {
    container.textContent = "Dataset not found.";
  }
}

document.querySelectorAll("[data-dataset-card]").forEach(initDatasetCardPage);
```

- [ ] **Step 2: Verify parse + existing helper test still pass**

Run: `node --check js/site.js && node --test scripts/site.test.mjs`
Expected: PARSE OK and 4 tests pass.

- [ ] **Step 3: Manually verify the dataset page renders**

Run: `python3 -m http.server 8000` (leave running), open `http://localhost:8000/pages/dataset.html?id=bigearthnet`.
Expected: the page shows the title "BigEarthNet", the summary lead, an Overview paragraph, a Details list (Task/Modality/Size/Samples/License/Year), a Versions list with **v1.0** and **v2.0 (reBEN)**, and a Links row with Paper / Homepage / TensorFlow Datasets / TorchGeo chips. Confirm `?id=eurosat` also shows two versions (RGB, All bands). Confirm `?id=does-not-exist` shows "Dataset not found." Stop the server when done.

- [ ] **Step 4: Commit**

```bash
git add js/site.js
git commit -m "feat(datasets): render dataset detail card (overview, details, versions, links)"
```

---

## Task 8: Style the Details/Versions blocks

**Files:**
- Modify: `css/style.css` (append near the other `.paper-card-*` rules, e.g. after line ~2114)

- [ ] **Step 1: Add the CSS**

Append to `css/style.css`:

```css
.dataset-card-details .dataset-detail-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 24px;
  margin: 0;
  max-width: 760px;
}

.dataset-detail-term {
  margin: 0;
  color: var(--paper-meta);
  font-size: 14px;
  font-weight: 600;
}

.dataset-detail-value {
  margin: 0;
  color: var(--paper-body);
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.dataset-versions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  max-width: 760px;
}

.dataset-versions-heading {
  margin: 0;
  color: var(--paper-title);
  font-size: 14px;
  font-weight: 650;
}

.dataset-version {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  padding: 10px 14px;
  border: 1px solid var(--paper-rule);
  border-radius: 10px;
  color: var(--paper-body);
  text-decoration: none;
}

a.dataset-version:hover {
  border-color: var(--link);
}

.dataset-version-name {
  font-weight: 600;
  color: var(--paper-title);
}

.dataset-version-meta {
  color: var(--paper-meta);
  font-size: 14px;
}
```

- [ ] **Step 2: Manually verify styling**

Run: `python3 -m http.server 8000` (leave running), hard-reload `http://localhost:8000/pages/dataset.html?id=bigearthnet`.
Expected: the Details list is a two-column term/value grid; the Versions appear as bordered rows with the version name bolded and size/samples in muted text. Stop the server when done.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat(datasets): style dataset details and versions blocks"
```

---

## Task 9: Wire dataset list rows to internal detail pages

**Files:**
- Modify: `js/site.js` — `normalizeCombinedResource` (line ~1532) and `createCombinedResourceRow` (line ~1564)
- Modify: `pages/datasets.html` — cache-bust query strings

- [ ] **Step 1: Update `normalizeCombinedResource`**

Replace the entire `normalizeCombinedResource` function (lines ~1532-1562) with:

```js
function normalizeCombinedResource(item, type, index) {
  const isDataset = type === "dataset";
  const id = String(
    item.id || item.rawDatasetId || item.dataset || item.benchmark || item.name || index
  );
  const title = String(
    isDataset ? item.name || item.dataset || "" : item.benchmark || item.name || ""
  );
  const detail = String(
    isDataset
      ? item.modality || item.sensorModality || item.size || item.sizeResolution || item.source || ""
      : item.metric || item.dataset_or_challenge || item.evidence || ""
  );
  const externalUrl = String(
    isDataset
      ? item.sourceUrl || item.source_url || ""
      : /^https?:\/\//i.test(String(item.source_url || "")) ? item.source_url : ""
  );
  const url = isDataset ? `dataset.html?id=${encodeURIComponent(id)}` : externalUrl;
  const external = !isDataset;
  const year = Number(item.year) || 0;
  const task = String(item.task || "");
  const typeLabel = isDataset ? "Dataset" : "Benchmark";
  const searchText = [title, typeLabel, task, detail, year, url].join(" ").toLowerCase();

  return {
    index,
    id,
    type,
    typeLabel,
    title,
    task,
    detail,
    url,
    external,
    year,
    searchText,
  };
}
```

- [ ] **Step 2: Update the link wiring in `createCombinedResourceRow`**

In `createCombinedResourceRow` (line ~1584), replace:

```js
  if (item.url) {
    setResourceRowLink(row, item.url, {
      target: "_blank",
      label: `Open ${item.title || item.typeLabel}`,
    });
  }
```

with:

```js
  if (item.url) {
    setResourceRowLink(row, item.url, {
      target: item.external ? "_blank" : "",
      label: `Open ${item.title || item.typeLabel}`,
    });
  }
```

- [ ] **Step 3: Bump cache-bust query strings in `pages/datasets.html`**

In `pages/datasets.html`, change `../css/style.css?v=20260612-66` to `../css/style.css?v=20260617-1` and `../js/site.js?v=20260612-56` to `../js/site.js?v=20260617-1`.

- [ ] **Step 4: Verify parse + helper tests**

Run: `node --check js/site.js && node --test scripts/site.test.mjs`
Expected: PARSE OK and 4 tests pass.

- [ ] **Step 5: Manually verify the list links into detail pages**

Run: `python3 -m http.server 8000` (leave running), open `http://localhost:8000/pages/datasets.html`.
Expected: the table lists the 12 clean datasets (filter shows "12 datasets" when type=Datasets; benchmarks still load from `data/raw/benchmarks.json`? — note: benchmarks still point at `../data/benchmarks.json`, which no longer exists, so the benchmark half will be empty. See Step 6). Clicking the **BigEarthNet** row navigates **in the same tab** to `dataset.html?id=bigearthnet` and renders the card. A benchmark row (if present) still opens its source in a new tab. Stop the server when done.

- [ ] **Step 6: Restore the benchmarks data source**

The combined list fetches both `data-datasets-src` and `data-benchmarks-src`, and fails the whole table if **either** fetch 404s. Since `benchmarks.json` was moved to `data/raw/`, point the page at the raw file so benchmarks keep working unchanged (benchmarks are out of scope for cleanup this plan). In `pages/datasets.html`, change `data-benchmarks-src="../data/benchmarks.json"` to `data-benchmarks-src="../data/raw/benchmarks.json"`.

Re-run Step 5's manual check: both datasets (12, linking internally) and benchmarks (from raw, linking out) now render.

- [ ] **Step 7: Commit**

```bash
git add js/site.js pages/datasets.html
git commit -m "feat(datasets): link dataset rows to internal detail pages; restore benchmarks source"
```

---

## Task 10: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run:
```bash
python3 -m unittest scripts.test_clean_datasets -v
( cd scripts && python3 -m unittest test_build_clean_datasets -v )
node --test scripts/site.test.mjs
node --check js/site.js
python3 -m json.tool data/datasets.json > /dev/null && echo "datasets.json OK"
```
Expected: all Python tests pass, all Node tests pass, PARSE OK, "datasets.json OK".

- [ ] **Step 2: Full manual smoke test**

Run: `python3 -m http.server 8000` (leave running). Verify each:
- `http://localhost:8000/pages/datasets.html` — 12 datasets listed; search/filter work; clicking a dataset row navigates same-tab to its detail page; benchmark rows open source in a new tab.
- `http://localhost:8000/pages/dataset.html?id=bigearthnet` — title, lead, Overview, Details grid, two Versions, Links chips; the close (×) returns to `datasets.html`; the save (♥) toggles.
- `http://localhost:8000/pages/dataset.html?id=eurosat` — two versions (RGB, All bands).
- `http://localhost:8000/pages/paper.html?id=real-noise-decoupling-for-hyperspectral-image-denoising-2026` — paper page still renders links (regression check for Task 4).
- Browser console shows no errors on any page.

Stop the server when done.

- [ ] **Step 3: Update `data/README.md`**

In `data/README.md`, update the `datasets.json` line to describe the new clean, curated, deduplicated index (one entry per dataset, versions consolidated, rendered by `pages/dataset.html`), and note that `data/raw/datasets.json` and `data/raw/benchmarks.json` are the raw scrapes and that `scripts/build_clean_datasets.py` assists curation.

- [ ] **Step 4: Commit**

```bash
git add data/README.md
git commit -m "docs(datasets): document clean dataset index + curation workflow"
```

---

## Self-Review

**Spec coverage:**
- "Put current datasets/benchmarks to raw file" → already done by the user (`data/raw/datasets.json`, `data/raw/benchmarks.json`); Task 9 Step 6 repoints the page at the raw benchmarks so nothing breaks; Task 2 reads the raw datasets.
- "Make a new clean file, add clean ones one by one" → Tasks 1 + 3 build `data/datasets.json` entry by entry.
- "BigEarthNet 19 → only one" → Task 1 schema test asserts BigEarthNet appears exactly once; Task 2 dedup script + test collapse variants.
- "Start with PyTorch geospatial (TorchGeo) + TFDS datasets" → Task 3's first batch is drawn from the TorchGeo/TFDS overlap, with TorchGeo/TFDS links.
- "Each dataset gets a page like the paper page, same style" → Tasks 6-8 add `pages/dataset.html` + `renderDatasetCard` reusing `paper-card-*` classes.
- "Different versions all in one page" → `versions` array in the schema; `appendDatasetVersions` renders them; BigEarthNet/EuroSAT/So2Sat demonstrate it.
- "Links section: paper, homepage, version, dataset size, …" → Links row (paper/homepage/tfds/torchgeo/download chips via `paperResourceMeta`) + Details block (size, samples, license, etc.) + Versions list (size/samples per version). This matches the chosen "Details block + Links row" layout.

**Placeholder scan:** No "TBD"/"implement later". Task 3 Step 3 (remaining 6 datasets) is genuine curation work, not a code placeholder — each has its `id`, task, and canonical source URLs specified; only externally-sourced numbers (size/sample counts) are filled by reading the cited pages, which cannot be invented.

**Type consistency:** Schema field names (`id`, `name`, `summary`, `description`, `task`, `modality`, `size`, `numSamples`, `license`, `year`, `sources`, `versions[{name,year,size,numSamples,url}]`, `links`) are identical across the JSON (Tasks 1, 3), the Python schema test (Task 1), and the JS renderers (`DATASET_DETAIL_FIELDS`, `appendDatasetDetails`, `appendDatasetVersions`, `renderDatasetCard` in Task 7). `getDatasetItems` accepts `{datasets}`/array/empty consistently in Task 5 (test) and Task 7 (`initDatasetCardPage`). The `external` flag added in `normalizeCombinedResource` (Task 9 Step 1) is consumed in `createCombinedResourceRow` (Task 9 Step 2).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-17-dataset-pages.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
