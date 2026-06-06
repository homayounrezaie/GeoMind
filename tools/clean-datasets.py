#!/usr/bin/env python3
"""Clean the raw dataset CSV and refresh the datasets page."""

from __future__ import annotations

import csv
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw" / "datasets.csv"
JSON_PATH = ROOT / "data" / "datasets.json"
DATASETS_PAGE_PATH = ROOT / "pages" / "datasets.html"
INDEX_PATH = ROOT / "index.html"
MAX_YEAR = 2026

DATASET_HOSTS = (
    "huggingface.co/datasets/",
    "zenodo.org/records/",
    "purl.stanford.edu",
    "bigearth.net",
    "captain-whu.github.io/",
    "spacenet.ai",
    "xviewdataset.org",
    "project.inria.fr/aerialimagelabeling",
    "www2.isprs.org/commissions/comm2/wg4/benchmark",
)

STRONG_GEO_TERMS = (
    "remote-sensing",
    "remote sensing",
    "earth-observation",
    "earth observation",
    "satellite",
    "satellite-imagery",
    "satellite imagery",
    "sentinel",
    "landsat",
    "copernicus",
    "modis",
    "viirs",
    "sar",
    "synthetic aperture",
    "lidar",
    "aerial",
    "uav",
    "drone",
    "orthophoto",
    "orthomosaic",
    "hyperspectral",
    "multispectral",
    "land-cover",
    "land cover",
    "ndvi",
    "stac",
    "dem",
    "elevation",
    "osm",
    "openstreetmap",
    "geojson",
    "geotiff",
    "raster",
    "mapillary",
    "worldview",
    "naip",
    "flood",
    "wildfire",
    "vegetation",
    "crop",
    "building footprint",
    "nighttime light",
    "weather data",
    "climate data",
    "precipitation",
    "rainfall",
    "zarr",
    "netcdf",
)

EXCLUDED_STRUCTURED_TERMS = (
    "benchmark",
    "bench",
    "challenge",
    "leaderboard",
    "winning solution",
    "winning solutions",
    "toolbox",
    "awesome",
    "survey",
    "paper list",
    "pretrained",
    "checkpoint",
    "weights",
    "model card",
    "tutorial",
    "example",
    "sample",
    "demo",
    "prototype",
    "test",
    "toy",
    "dummy",
    "temp",
    "temporary",
    "copy of",
    "fork of",
    "readme",
    "code for",
    "implementation",
    "tweets",
    "sentences",
    "fever",
    "synthetic text",
    "lessons learned",
)

GENERIC_NAMES = {
    "",
    "dataset",
    "datasets",
    "public datasets",
    "optical datasets",
    "sar",
    "lidar",
    "satellite",
    "remote sensing",
    "geospatial",
    "data",
    "images",
    "imagery",
    "paper",
    "project",
    "benchmark",
    "challenge",
    "geodata",
    "geo dataset",
    "geo_dataset",
}

TEXT_ONLY_TASKS = (
    "text-classification",
    "text-generation",
    "text-retrieval",
    "table-to-text",
    "sentence-similarity",
    "translation",
    "fill-mask",
)

NON_TEXT_MODALITY_TERMS = (
    "modality:image",
    "modality:tabular",
    "modality:geospatial",
    "modality:audio",
    "stac",
    "zarr",
    "netcdf",
    "geotiff",
    "raster",
    "sentinel",
    "landsat",
    "satellite",
    "aerial",
    "uav",
    "drone",
    "sar",
    "lidar",
)

TASK_LABELS = (
    ("visual-question-answering", "Visual question answering"),
    ("multiple-choice", "Visual question answering"),
    ("image-text-to-text", "Image-text training"),
    ("image-to-text", "Image captioning"),
    ("text-to-image", "Image generation"),
    ("image-text-to-image", "Image-to-image"),
    ("image-classification", "Image classification"),
    ("zero-shot-image-classification", "Image classification"),
    ("semantic-segmentation", "Semantic segmentation"),
    ("image-segmentation", "Image segmentation"),
    ("object-detection", "Object detection"),
    ("change-detection", "Change detection"),
    ("time-series-forecasting", "Time-series forecasting"),
    ("weather-forecasting", "Weather forecasting"),
    ("tabular-regression", "Tabular regression"),
    ("tabular-classification", "Tabular classification"),
    ("feature-extraction", "Feature extraction"),
    ("image-to-image", "Image-to-image"),
    ("audio-classification", "Audio classification"),
    ("classification", "Classification"),
    ("segmentation", "Segmentation"),
    ("detection", "Detection"),
)

MODALITY_LABELS = (
    ("sentinel-2", "Sentinel-2"),
    ("sentinel-1", "Sentinel-1"),
    ("sentinel", "Sentinel"),
    ("landsat", "Landsat"),
    ("modis", "MODIS"),
    ("viirs", "VIIRS"),
    ("sar", "SAR"),
    ("lidar", "LiDAR"),
    ("hyperspectral", "Hyperspectral"),
    ("multispectral", "Multispectral"),
    ("aerial", "Aerial imagery"),
    ("uav", "UAV imagery"),
    ("drone", "Drone imagery"),
    ("satellite", "Satellite imagery"),
    ("earth-observation", "Earth observation"),
    ("remote-sensing", "Remote sensing"),
    ("zarr", "Zarr"),
    ("netcdf", "NetCDF"),
    ("stac", "STAC"),
    ("geotiff", "GeoTIFF"),
    ("osm", "OpenStreetMap"),
    ("openstreetmap", "OpenStreetMap"),
    ("weather", "Weather"),
    ("climate", "Climate"),
    ("geospatial", "Geospatial"),
)

SIZE_LABELS = {
    "n<1K": "<1K rows",
    "1K<n<10K": "1K-10K rows",
    "10K<n<100K": "10K-100K rows",
    "100K<n<1M": "100K-1M rows",
    "1M<n<10M": "1M-10M rows",
    "10M<n<100M": "10M-100M rows",
    "100M<n<1B": "100M-1B rows",
    "1B<n<10B": "1B-10B rows",
    "10B<n<100B": "10B-100B rows",
    "100B<n<1T": "100B-1T rows",
    "n>1T": ">1T rows",
}


def clean_text(value: str) -> str:
    value = (value or "").replace("_", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value.strip(" -_|")


def key_for(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def slug_for(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (value or "").lower()).strip("_")


def combined_text(row: dict[str, str], fields: tuple[str, ...]) -> str:
    return " ".join(row.get(field, "") or "" for field in fields).lower()


def extract_year(row: dict[str, str]) -> int:
    for field in ("created_at", "last_modified"):
        match = re.search(r"\b(19\d{2}|20\d{2})\b", row.get(field, "") or "")
        if match:
            year = int(match.group(1))
            if 1900 <= year <= MAX_YEAR:
                return year

    match = re.search(r"year:(19\d{2}|20\d{2})", row.get("tags", "") or "", re.I)
    if match:
        year = int(match.group(1))
        if 1900 <= year <= MAX_YEAR:
            return year

    return 0


def parse_int(value: str) -> int:
    try:
        return int(value or "0")
    except ValueError:
        return 0


def is_dataset_host(url: str) -> bool:
    url = (url or "").lower()
    return any(pattern in url for pattern in DATASET_HOSTS)


def should_include(row: dict[str, str]) -> bool:
    name = clean_text(row.get("name", ""))
    url = row.get("url", "")
    all_text = combined_text(
        row,
        ("dataset_id", "name", "url", "matched_terms", "task_categories", "tags", "description"),
    )
    structured_text = combined_text(
        row,
        ("dataset_id", "name", "matched_terms", "task_categories", "tags"),
    )

    if not name or not url:
        return False
    if key_for(name) in GENERIC_NAMES:
        return False
    if len(name) < 3 or len(name) > 76:
        return False
    if not is_dataset_host(url):
        return False
    if not any(term in all_text for term in STRONG_GEO_TERMS):
        return False
    if any(term in structured_text for term in EXCLUDED_STRUCTURED_TERMS):
        return False
    if "/models/" in url.lower() or "huggingface.co/spaces/" in url.lower():
        return False

    task_text = (row.get("task_categories", "") or "").lower()
    if any(task in task_text for task in TEXT_ONLY_TASKS) and not any(
        term in all_text for term in NON_TEXT_MODALITY_TERMS
    ):
        return False

    if "modality:text" in structured_text and not any(
        term in structured_text
        for term in ("modality:image", "modality:tabular", "modality:geospatial", "modality:audio")
    ):
        return False

    return True


def normalize_task(row: dict[str, str]) -> str:
    text = combined_text(row, ("task_categories", "tags", "matched_terms")).replace("_", "-")

    for needle, label in TASK_LABELS:
        if needle in text:
            return label

    raw = clean_text(row.get("task_categories", ""))
    if raw and len(raw) < 48 and raw.lower() not in {"datasets", "public datasets", "other"}:
        return raw.replace("|", " / ").title()

    return "Geospatial dataset"


def normalize_modality(row: dict[str, str]) -> str:
    text = combined_text(
        row,
        ("matched_terms", "tags", "description", "name", "dataset_id"),
    ).replace("_", "-")
    labels: list[str] = []

    for needle, label in MODALITY_LABELS:
        if needle in text and label not in labels:
            labels.append(label)

    broad = {"Geospatial", "Remote sensing", "Earth observation", "Satellite imagery"}
    concrete = [label for label in labels if label not in broad]
    chosen = (concrete or labels)[:2]
    return " / ".join(chosen) if chosen else "Geospatial"


def normalize_size_or_resolution(row: dict[str, str]) -> str:
    raw = "|".join((row.get("size_categories", ""), row.get("tags", "")))
    labels: list[str] = []

    for key, label in SIZE_LABELS.items():
        if key.lower() in raw.lower() and label not in labels:
            labels.append(label)

    if labels:
        return " / ".join(labels[:2])

    description = row.get("description", "") or ""
    resolution = re.search(r"\b\d+(?:\.\d+)?\s?(?:cm|m|km)\b", description, re.I)
    if resolution:
        return resolution.group(0)

    return "Catalogued"


def source_rank(row: dict[str, str]) -> int:
    url = (row.get("url", "") or "").lower()
    tags = (row.get("tags", "") or "").lower()

    if "huggingface.co/datasets/torchgeo" in url:
        return 100
    if "huggingface.co/datasets/major-tom" in url:
        return 98
    if "huggingface.co/datasets/" in url:
        return 90
    if "source:manual" in tags:
        return 76
    if "structured-ingest" in tags:
        return 72
    if "link_status:200" in tags:
        return 66
    return 40


def clean_rows(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    selected = [row for row in rows if should_include(row)]
    deduped: dict[str, tuple[tuple[int, int, int, int], dict[str, str]]] = {}

    for row in selected:
        name_key = key_for(row.get("name", ""))
        score = (
            source_rank(row),
            parse_int(row.get("downloads", "")),
            parse_int(row.get("likes", "")),
            extract_year(row),
        )
        if name_key not in deduped or score > deduped[name_key][0]:
            deduped[name_key] = (score, row)

    cleaned: list[dict[str, object]] = []
    used_ids: set[str] = set()

    for _, row in deduped.values():
        name = clean_text(row.get("name", ""))
        base_id = f"dataset_{slug_for(row.get('dataset_id') or name)}"
        local_id = base_id
        suffix = 2

        while local_id in used_ids:
            local_id = f"{base_id}_{suffix}"
            suffix += 1

        used_ids.add(local_id)
        year = extract_year(row)

        cleaned.append(
            {
                "id": local_id,
                "dataset": name,
                "task": normalize_task(row),
                "sensorModality": normalize_modality(row),
                "sizeResolution": normalize_size_or_resolution(row),
                "year": year,
                "sourceUrl": row.get("url", ""),
                "source": "Hugging Face" if "huggingface.co/datasets/" in row.get("url", "") else "Dataset source",
                "downloads": parse_int(row.get("downloads", "")),
                "likes": parse_int(row.get("likes", "")),
                "rawDatasetId": row.get("dataset_id", ""),
            }
        )

    cleaned.sort(
        key=lambda row: (
            int(row["year"]),
            int(row["downloads"]),
            int(row["likes"]),
            str(row["dataset"]).lower(),
        ),
        reverse=True,
    )
    return cleaned


def render_link(url: str) -> str:
    escaped_url = html.escape(url, quote=True)
    if url.startswith(("http://", "https://")):
        return f'<a href="{escaped_url}" target="_blank" rel="noreferrer">View dataset card</a>'
    return f'<a href="{escaped_url}">View dataset card</a>'


def render_rows(rows: list[dict[str, object]]) -> str:
    rendered: list[str] = []

    for row in rows:
        year = int(row["year"])
        rendered.append(
            "\n".join(
                [
                    f'              <tr data-year="{year}">',
                    f"                <td>{html.escape(str(row['dataset']))}</td>",
                    f"                <td>{html.escape(str(row['task']))}</td>",
                    f"                <td>{html.escape(str(row['sensorModality']))}</td>",
                    f"                <td>{html.escape(str(row['sizeResolution']))}</td>",
                    f"                <td>{render_link(str(row['sourceUrl']))}</td>",
                    "              </tr>",
                ]
            )
        )

    return "\n".join(rendered)


def replace_between(text: str, start_pattern: str, end_pattern: str, replacement: str) -> str:
    pattern = re.compile(f"({start_pattern})(.*?)({end_pattern})", re.S)
    return pattern.sub(lambda match: f"{match.group(1)}{replacement}{match.group(3)}", text, count=1)


def update_datasets_page(rows: list[dict[str, object]]) -> None:
    page = DATASETS_PAGE_PATH.read_text()
    page = page.replace("<th scope=\"col\">Resolution</th>", "<th scope=\"col\">Size / Resolution</th>")
    page = replace_between(page, r"<tbody>\n", r"\n\s*</tbody>", render_rows(rows))
    DATASETS_PAGE_PATH.write_text(page)


def update_home_count(count: int) -> None:
    page = INDEX_PATH.read_text()
    label = f"{count:,} datasets"
    page = re.sub(r"Datasets <span class=\"section-count\">[^<]+</span>", f'Datasets <span class="section-count">{label}</span>', page, count=1)
    INDEX_PATH.write_text(page)


def main() -> None:
    if not RAW_PATH.exists():
        raise SystemExit(f"Missing raw dataset export: {RAW_PATH}")

    with RAW_PATH.open(newline="", encoding="utf-8") as source:
        raw_rows = list(csv.DictReader(source))

    rows = clean_rows(raw_rows)
    JSON_PATH.write_text(json.dumps(rows, indent=2) + "\n")
    update_datasets_page(rows)
    update_home_count(len(rows))
    print(f"Wrote {len(rows)} cleaned datasets")


if __name__ == "__main__":
    main()
