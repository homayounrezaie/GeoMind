# GeoMind Data

This folder separates published site data from local raw exports.

- Published card pages live in `../cards/`.
- `models.json` is the cleaned, committed model index used by the public site.
- `datasets.json` is the cleaned, committed, deduplicated dataset index (one entry per dataset, with multiple versions consolidated into each entry's `versions` array). It powers the per-dataset detail pages at `pages/dataset.html`.
- `datasets.candidate.json` is the single committed curation **pool**: one deduplicated entry per dataset / benchmark under a top-level `candidates` array, each tagged with a `type` field (`dataset` or `benchmark`). It is consolidated from every source (the former raw scrapes, the HuggingFace CSV export, TorchGeo / TFDS / GEO-Bench / TerraTorch / Planetary Computer / satellite-image-deep-learning, and individual papers). A human promotes good entries from this pool into the clean `datasets.json`. See `curation-plan.md` for how it was built.
- `scripts/build_candidates.py` is the one-time consolidation tool that produced the pool. The former raw scrapes (`raw/datasets.json`, `raw/benchmarks.json`) and source CSVs (`raw/datasets.csv`, `raw/benchmarks.csv`) were folded into it and then removed; the candidate file is now the source of truth and the script will not overwrite it with an empty rebuild.
- `papers.json` is the cleaned, committed paper index generated from geospatial paper rows.
- `dataset-benchmark-papers.candidate.json` is a paper-level curation pool for papers that introduce or package datasets, benchmarks, or closely related evaluation resources; keep these separate from ordinary method-paper promotion decisions.
- `companies.json` is the cleaned, committed company index used by the public site.
- `../paper-topics.json` is a committed taxonomy used for paper organization.
- Remaining `raw/*.csv` files and `raw/raw-papers.json` are local raw inputs, intentionally ignored by Git where large/noisy; they should be cleaned before anything is published. There is no longer a top-level `data/benchmarks.json`.
