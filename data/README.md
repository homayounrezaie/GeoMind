# GeoMind Data

This folder separates published site data from local raw exports.

- `models.json` is the cleaned, committed model index used by the public site.
- `benchmarks.json` is the cleaned benchmark index generated from high-confidence benchmark rows.
- `paper-topics.json` is a committed taxonomy used for paper organization.
- `raw/*.csv` files are local raw inputs and are intentionally ignored by Git. They can be large and noisy, so they should be cleaned before anything is published.

Run `tools/clean-models.py` after updating `raw/foundation-models.csv`.
