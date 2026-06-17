# GeoMind Data

This folder separates published site data from local raw exports.

- Published card pages live in `../cards/`.
- `models.json` is the cleaned, committed model index used by the public site.
- `datasets.json` is the cleaned, committed, deduplicated dataset index (one entry per dataset, with multiple versions consolidated into each entry's `versions` array). It powers the per-dataset detail pages at `pages/dataset.html`.
- `datasets.candidate.json` and `benchmarks.candidate.json` are the committed curation **pools**: one deduplicated entry per dataset / benchmark, consolidated from every source (the former raw scrapes, the HuggingFace CSV export, TorchGeo / TFDS / GEO-Bench / TerraTorch / Planetary Computer / satellite-image-deep-learning, and individual papers). A human promotes good entries from these pools into the clean `datasets.json`. See `curation-plan.md` for how they were built.
- `scripts/build_candidates.py` is the one-time consolidation tool that produced the candidate pools. The former raw scrapes (`raw/datasets.json`, `raw/benchmarks.json`) and source CSVs (`raw/datasets.csv`, `raw/benchmarks.csv`) were folded into the pools and then removed; the candidate files are now the source of truth and the script will not overwrite them with an empty rebuild.
- `papers.json` is the cleaned, committed paper index generated from geospatial paper rows.
- `companies.json` is the cleaned, committed company index used by the public site.
- `../paper-topics.json` is a committed taxonomy used for paper organization.
- Remaining `raw/*.csv` files and `raw/raw-papers.json` are local raw inputs, intentionally ignored by Git where large/noisy; they should be cleaned before anything is published. There is no longer a top-level `data/benchmarks.json`.
