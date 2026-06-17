# Dataset & Benchmark Candidate Consolidation Plan

Goal: aggregate datasets & benchmarks from every listed source (web pages + raw
files) into the candidate curation pool, then remove the now-redundant raw
files. The candidate files become the single, git-tracked curation source from
which clean entries are promoted into `data/datasets.json`.

Status legend: `[ ]` todo · `[x]` done · `[~]` partial (see note)

---

## Decisions (flag if you disagree)

- **Single candidate file (updated).** Originally split into
  `datasets.candidate.json` + `benchmarks.candidate.json`, then merged per user
  request into one file `data/datasets.candidate.json` with a top-level
  `candidates` array; every entry carries a `type` field (`dataset` |
  `benchmark`) so the two schemas stay distinguishable. **5,946 candidates total
  (4,427 datasets + 1,519 benchmarks).**
- **Enriched schema.** Keep existing fields and add the useful columns from the
  raw files (task, modality, size, year, description, downloads, likes) so
  deleting the raw files does not lose their metadata.
- **Candidate files become git-tracked.** Remove them from `.gitignore`;
  otherwise the consolidated data is untracked and lost the moment raw is gone.
- **Dedup by normalized name** (reuse `normalize_name` from the existing build
  script), merging duplicate rows into one entry with `raw_count` / `raw_names`.
- **Delete raw last**, only after verifying every source row was captured.
  Note: `datasets.csv` / `benchmarks.csv` are gitignored → their deletion is
  **permanent** (the JSON files are recoverable from git history).
- **Untouched raw files** (not in scope): `foundation-models.csv`,
  `raw-papers.json`, `techniques.csv`.

---

## Sources

### Web
- [x] https://github.com/satellite-image-deep-learning/datasets — 556 records
- [x] https://www.tensorflow.org/datasets/catalog/overview — 5 (only geospatial ones)
- [x] https://docs.torchgeo.org/en/stable/api/datasets.html# — 120 records
- [x] https://github.com/torchgeo/terratorch — 36 records (partial; README is high-level)
- [x] https://github.com/servicenow/geo-bench — 12 datasets + 12 benchmarks
- [x] https://docs.torchgeo.org/en/stable/api/datasets.html#geospatial-datasets — (same page as TorchGeo above)
- [x] https://planetarycomputer.microsoft.com/catalog#Snow — 134 collections (via STAC API)

### Additional (user follow-up)
- [x] Manual hyperspectral datasets: CAVE, AVIRIS, ROSIS, HYDICE, EO-1 Hyperion, Harvard, ICVL, NUS, NTIRE18 — 9 records
- [x] Paper https://arxiv.org/pdf/2511.15658 (GEO-Bench-2) — 19 datasets + 19 benchmarks
- [x] Paper https://ieeexplore.ieee.org/.../arnumber=7891544 (RS Scene Classification, Cheng 2017; via free arXiv:1703.00121) — 8 datasets + 24 benchmarks

### Raw files (to ingest, then delete)
- [x] `data/raw/datasets.json`  (875 rows · committed) — ingested ✓, deleted ✓
- [x] `data/raw/datasets.csv`   (4,658 rows · gitignored) — ingested ✓, deleted ✓ (permanent)
- [x] `data/raw/benchmarks.json` (286 rows · committed) — ingested ✓, deleted ✓
- [x] `data/raw/benchmarks.csv`  (1,797 rows · gitignored) — ingested ✓, deleted ✓ (permanent)

---

## Target schemas

### `datasets.candidate.json` entry
```jsonc
{
  "id": "bigearthnet",            // normalized dedup key
  "name": "BigEarthNet",
  "known": false,                  // true if in the curated KNOWN registry
  "task": "Multi-label land-cover classification",
  "modality": "Sentinel-1/2",
  "sizeResolution": "≈66 GB",
  "year": 2019,
  "description": "...",            // from CSV / web where available
  "downloads": 85,                  // HF metadata where available
  "likes": 3,
  "sources": ["Hugging Face", "TorchGeo", "TFDS", "satellite-image-deep-learning"],
  "candidate_urls": ["https://..."],
  "raw_count": 19,
  "raw_names": ["BigEarthNet", "BigEarthNet-S2", "..."]
}
```

### `benchmarks.candidate.json` entry
```jsonc
{
  "id": "earthvlset-semantic-segmentation",
  "name": "EarthVLSet - Semantic segmentation",
  "dataset": "EarthVLSet",
  "task": "Semantic segmentation",
  "metric": "Recall",
  "higher_is_better": true,
  "year": 2026,
  "sources": ["paperswithcode", "geo-bench"],
  "candidate_urls": ["https://..."],
  "paper_ids": ["paper_2601_02783"],
  "raw_count": 1
}
```

---

## Tasks

### Phase 0 — Setup
- [x] Explore context (schemas, build script, gitignore, counts)
- [x] Write this plan

### Phase 1 — Ingest raw files
- [x] Write `scripts/build_candidates.py` (generic: ingest JSON + CSV source records, dedup, merge)
- [x] Ingest `raw/datasets.json` + `raw/datasets.csv` → merge into `datasets.candidate.json` (enriched)
- [x] Ingest `raw/benchmarks.json` + `raw/benchmarks.csv` → `benchmarks.candidate.json`
- [x] Record before/after entry counts — datasets **860 → 4103**; benchmarks **→ 1464**

### Phase 2 — Web sources
- [x] Fetch + extract entries from each of the 7 web pages (datasets and/or benchmarks)
- [x] Add 9 manual hyperspectral datasets + 2 papers (user follow-up)
- [x] Merge web/manual/paper entries into the candidate files (dedup by normalized name; add source + url)
- [x] Note partial coverage: TerraTorch (README high-level), Planetary Computer (JS page → STAC API). Final: datasets **4427**, benchmarks **1519**

### Phase 3 — Wire-up & pipeline
- [x] Remove `datasets.candidate.json` from `.gitignore` (now tracked; `benchmarks.candidate.json` was never ignored; ignore temp `data/_staging/`)
- [x] Retire `scripts/build_clean_datasets.py` (superseded by `build_candidates.py`); repointed tests → `test_build_candidates.py`; added empty-rebuild safety guard
- [x] Ensure existing tests still pass — 10/10 pass

### Phase 4 — Verify
- [x] Every entry has `id` + `name`; **0 duplicate ids** (datasets & benchmarks). ~7% of datasets / ~80% of benchmarks have no URL (source gave none) — acceptable for leads
- [x] Spot-check dedup — EuroSAT merged across HF+TFDS+TorchGeo+sat-img-dl (45 urls); 562 datasets matched >1 source
- [x] CSV/web metadata captured: 3,998 dataset descriptions, 3,424 tasks, 1,562 downloads; benchmarks 1,317 metrics / 1,256 paper_ids. Dropped CSV-only columns (tags, trending, benchmark score_value/evidence) — not part of the curation-lead schema

### Phase 5 — Delete raw
- [x] `git rm data/raw/datasets.json data/raw/benchmarks.json`
- [x] `rm data/raw/datasets.csv data/raw/benchmarks.csv` (gitignored; permanent) + removed temp `data/_staging/`
- [x] Update `data/README.md` to reflect new source-of-truth

### Phase 6 — Finalize
- [x] Commit all changes (`ab0f7bc`)
- [x] Pushed to `main` (with user confirmation)
