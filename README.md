# GeoMind

GeoMind is a static website for structured, visual overviews of Geospatial AI models, datasets, benchmarks, and papers.

## Local Preview

Run a local static server from the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

This repo is ready for GitHub Pages.

1. Push the project to GitHub.
2. In the repository, go to `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `GitHub Actions`.
4. Push to `main`; the included workflow will publish the static site.

The workflow copies only the site files into `_site`, excluding local screenshots and development artifacts.

## Structure

```text
index.html
assets/
  css/styles.css
  js/tabs.js
  img/geomind-logo.png
models/
datasets-benchmarks/
papers/
about/
privacy/
terms/
cookies/
```
