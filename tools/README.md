# GeoMind Tools

Local scripts for turning raw data exports into small static assets.

- `clean-models.py` reads `data/raw/foundation-models.csv`, writes `data/models.json`, and rebuilds `pages/models.html`.

These scripts are not part of the browser runtime. The public site stays static so GitHub Pages can cache and serve it efficiently.
