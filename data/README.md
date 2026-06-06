# GeoMind Data

This folder separates published site data from local raw exports.

- `models.json` is the cleaned, committed model index used by the public site.
- `datasets.json` is the cleaned, committed dataset index generated from dataset-hosted geospatial rows.
- `benchmarks.json` is the cleaned benchmark index generated from high-confidence benchmark rows.
- `papers.json` is the cleaned, committed paper index generated from geospatial paper rows.
- `paper-topics.json` is a committed taxonomy used for paper organization.
- `raw/*.csv` files are local raw inputs and are intentionally ignored by Git. They can be large and noisy, so they should be cleaned before anything is published.

Run `tools/clean-models.py` after updating `raw/foundation-models.csv`.
Run `tools/clean-datasets.py` after updating `raw/datasets.csv`.
Run `tools/clean-papers.py` after updating `raw/papers.csv`.
