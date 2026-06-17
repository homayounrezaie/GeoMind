# GeoMind Data

This folder separates published site data from local raw exports.

- Published card pages live in `../cards/`.
- `models.json` is the cleaned, committed model index used by the public site.
- `datasets.json` is the cleaned, committed, deduplicated dataset index (one entry per dataset, with multiple versions consolidated into each entry's `versions` array). It powers the per-dataset detail pages at `pages/dataset.html`.
- `raw/datasets.json` and `raw/benchmarks.json` are the raw scrapes (committed) and serve as the curation source. `scripts/build_clean_datasets.py` dedupes `raw/datasets.json` into a gitignored `datasets.candidate.json` to assist hand-curation.
- `raw/benchmarks.json` is the committed benchmark list; the Datasets & Benchmarks page reads benchmarks from there. There is no longer a top-level `data/benchmarks.json`.
- `papers.json` is the cleaned, committed paper index generated from geospatial paper rows.
- `companies.json` is the cleaned, committed company index used by the public site.
- `../paper-topics.json` is a committed taxonomy used for paper organization.
- `raw/*.csv` files are local raw inputs and are intentionally ignored by Git. They can be large and noisy, so they should be cleaned before anything is published.
