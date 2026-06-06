#!/usr/bin/env python3
"""Clean the raw foundation-model CSV and refresh the models page."""

from __future__ import annotations

import csv
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATHS = [
    ROOT / "data" / "raw" / "foundation-models.csv",
    ROOT / "data" / "foundation-models.csv",
]
JSON_PATH = ROOT / "data" / "models.json"
MODELS_PAGE_PATH = ROOT / "pages" / "models.html"

INVALID_LABELS = {
    "",
    "-",
    "arxiv",
    "code",
    "github",
    "huggingface",
    "hugging face",
    "link",
    "model",
    "paper",
    "pdf",
    "repository",
    "source",
    "view",
    "\U0001f917 hugging face",
}

SKIP_NAME_KEYS = {
    "awesome",
    "code",
    "dataset",
    "datasets",
    "foundationmodels",
    "geospatialfoundationmodels",
    "github",
    "link",
    "paper",
    "papers",
    "remote-sensing-foundation-models",
    "remotesensingfoundationmodels",
    "survey",
}

CATEGORY_LABELS = {
    "agents": "Agent",
    "benchmark_evaluation": "Benchmark Evaluation",
    "embeddings_data": "Embedding Model",
    "foundation_models": "Foundation Model",
    "object_detection": "Object Detection",
    "generative": "Generative Model",
    "paper_models": "Research Model",
    "remote_sensing_pretraining": "Foundation Model",
    "segmentation": "Segmentation",
    "sensor_specific": "Sensor-Specific Model",
    "super_resolution": "Super-Resolution",
    "vision_language": "Vision-Language Model",
    "vision_location": "Vision-Location Model",
}

VENUE_LABELS = {
    "aaai": "AAAI",
    "acmmm": "ACM MM",
    "acl": "ACL",
    "cvpr": "CVPR",
    "eccv": "ECCV",
    "emnlp": "EMNLP",
    "iccv": "ICCV",
    "iclr": "ICLR",
    "icml": "ICML",
    "ijcai": "IJCAI",
    "kdd": "KDD",
    "neurips": "NeurIPS",
    "wacv": "WACV",
}

SOURCE_PRIORITY = {
    "curated": 100,
    "catalogue/models": 90,
    "Hugging Face": 84,
    "OpenAlex": 78,
    "arXiv": 72,
    "awesome_rsfm_github": 68,
    "paper-extraction": 62,
    "source_repo_link_audit": 52,
    "GitHub": 20,
}

CURATED_MODELS = [
    {
        "id": "alphaearth",
        "name": "AlphaEarth",
        "category": "Foundation Model",
        "venueYear": "2025",
        "year": 2025,
        "sourceUrl": "models/alphaearth.html",
        "source": "curated",
        "rawStatus": "curated",
        "rawCategory": "foundation_models",
    },
    {
        "id": "stram",
        "name": "STRAM",
        "category": "Graph Neural Network",
        "venueYear": "Neurocomputing 2026",
        "year": 2026,
        "sourceUrl": "https://github.com/Ahghaffari/stram",
        "source": "curated",
        "rawStatus": "curated",
        "rawCategory": "graph_neural_network",
    }
]


def clean_piece(value: str) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    value = value.strip(" -_|:/")
    value = re.sub(r"\s+\((code|paper|github|arxiv)\)$", "", value, flags=re.I)
    return value.strip()


def key_for(value: str) -> str:
    value = (value or "").lower()
    value = value.replace("++", "plusplus").replace("+", "plus")
    return re.sub(r"[^a-z0-9]+", "", value)


def split_model_labels(value: str) -> list[str]:
    parts = re.split(r"\s*;\s*", value or "")
    cleaned = []

    for part in parts:
        label = clean_piece(part)
        if key_for(label) in INVALID_LABELS or label.lower() in INVALID_LABELS:
            continue
        if label:
            cleaned.append(label)

    return cleaned


def choose_from_labels(labels: list[str], title: str) -> str:
    if not labels:
        return ""

    title_key = key_for(title)
    matches = [label for label in labels if key_for(label) and key_for(label) in title_key]

    if matches:
        return max(matches, key=len)

    return labels[0]


def fallback_name(row: dict[str, str]) -> str:
    title = clean_piece(row.get("title", ""))

    if "/" in title and not title.lower().startswith(("http://", "https://")):
        tail = clean_piece(title.rsplit("/", 1)[-1])
        if tail:
            return tail

    if ":" in title:
        prefix = clean_piece(title.split(":", 1)[0])
        if 2 <= len(prefix) <= 56:
            return prefix

    return title


def normalize_name(row: dict[str, str]) -> str:
    title = row.get("title", "")
    labels = split_model_labels(row.get("abbreviation", ""))
    labels += split_model_labels(row.get("paper_label", ""))
    name = choose_from_labels(labels, title) or fallback_name(row)

    overrides = {
        "satlas": "SatlasPretrain",
        "satlaspretrain": "SatlasPretrain",
        "clayfoundationmodel": "Clay",
        "alphaearthfoundations": "AlphaEarth",
    }

    return clean_piece(overrides.get(key_for(name), name))


def normalize_category(row: dict[str, str]) -> str:
    raw = row.get("category", "")
    return CATEGORY_LABELS.get(raw, raw.replace("_", " ").title() or "Model")


def row_year(row: dict[str, str]) -> int:
    value = row.get("year", "")
    match = re.search(r"(19|20)\d{2}", value)
    return int(match.group(0)) if match else 0


def normalize_venue_part(part: str, year: int) -> str:
    compact = key_for(part)

    for venue_key, venue_label in VENUE_LABELS.items():
        if venue_key in compact:
            match = re.search(r"(19|20)\d{2}", part)
            return f"{venue_label} {match.group(0) if match else year}".strip()

    known_patterns = [
        (r"ieee\s*tgrs", "IEEE TGRS"),
        (r"ieee\s*jstars", "IEEE JSTARS"),
        (r"ieee\s*tpami", "IEEE TPAMI"),
        (r"isprs\s*jprs", "ISPRS JPRS"),
        (r"nature\s+machine\s+intelligence", "Nature Machine Intelligence"),
        (r"remote\s+sensing", "Remote Sensing"),
        (r"arxiv", "arXiv"),
        (r"lncs", "LNCS"),
    ]

    for pattern, label in known_patterns:
        if re.search(pattern, part, flags=re.I):
            match = re.search(r"(19|20)\d{2}", part)
            return f"{label} {match.group(0) if match else year}".strip()

    return ""


def normalize_venue_year(row: dict[str, str]) -> str:
    year = row_year(row)
    venue = clean_piece(row.get("venue", ""))

    if "hugging face" in venue.lower():
        return f"Hugging Face {year}" if year else "Hugging Face"

    if venue.lower() == "github":
        return f"GitHub {year}" if year else "GitHub"

    parts = [clean_piece(part) for part in venue.split(";") if clean_piece(part)]

    for part in reversed(parts):
        normalized = normalize_venue_part(part, year)
        if normalized:
            return normalized

    if parts:
        part = parts[-1]
        if "/" in part and not year:
            return "Reference"
        part = re.sub(r"(?i)([a-z])((?:19|20)\d{2})$", r"\1 \2", part)
        return part

    return str(year) if year else "Unknown"


def source_url(row: dict[str, str]) -> str:
    for field in ("code_weights_url", "paper_url", "open_pdf_url", "url"):
        value = clean_piece(row.get(field, ""))
        if value:
            return clean_piece(value.split(";", 1)[0])
    return ""


def source_priority(item: dict[str, object]) -> tuple[int, int, int, str]:
    source = str(item.get("source", ""))
    year = int(item.get("year", 0))
    citation_count = str(item.get("citationCount", ""))
    citations = int(citation_count) if citation_count.isdigit() else 0
    return (SOURCE_PRIORITY.get(source, 40), year, citations, str(item.get("name", "")))


def should_skip(row: dict[str, str], name: str) -> bool:
    status = row.get("status", "")

    if status in {"candidate_tokenizer", "github_repo"}:
        return True

    if row.get("source", "") == "source_repo_link_audit":
        return True

    if row.get("category", "") in {"benchmark_evaluation", "dataset", "datasets"}:
        return True

    name_key = key_for(name)
    name_lower = name.lower()
    if not name_key or name_key in INVALID_LABELS or name_key in SKIP_NAME_KEYS:
        return True

    if "awesome" in name_lower or "overview of" in name_lower:
        return True

    if len(name.split()) > 8 or len(name) > 110:
        return True

    title = clean_piece(row.get("title", ""))
    if name == title and (len(name) > 70 or len(name.split()) > 8):
        return True

    if len(name) < 2:
        return True

    return False


def cleaned_models() -> list[dict[str, object]]:
    models: list[dict[str, object]] = list(CURATED_MODELS)
    source_path = next((path for path in SOURCE_PATHS if path.exists()), None)

    if source_path is None:
        raise SystemExit(
            "Missing data/raw/foundation-models.csv. Raw CSV exports are local inputs and are "
            "not committed to the GitHub Pages site."
        )

    with source_path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            name = normalize_name(row)

            if should_skip(row, name):
                continue

            models.append(
                {
                    "id": row.get("id", ""),
                    "name": name,
                    "category": normalize_category(row),
                    "venueYear": normalize_venue_year(row),
                    "year": row_year(row),
                    "sourceUrl": source_url(row),
                    "source": row.get("source", ""),
                    "rawStatus": row.get("status", ""),
                    "rawCategory": row.get("category", ""),
                    "citationCount": row.get("citation_count", ""),
                }
            )

    deduped: dict[str, dict[str, object]] = {}

    for item in models:
        key = key_for(str(item["name"]))
        current = deduped.get(key)
        if current is None or source_priority(item) > source_priority(current):
            deduped[key] = item

    return sorted(
        deduped.values(),
        key=lambda item: (-int(item.get("year", 0)), str(item.get("name", "")).lower()),
    )


def html_ascii(value: str) -> str:
    escaped = html.escape(value or "", quote=True)
    return escaped.encode("ascii", "xmlcharrefreplace").decode("ascii")


def render_rows(models: list[dict[str, object]]) -> str:
    rows = []

    for item in models:
        year = int(item.get("year", 0))
        name = html_ascii(str(item.get("name", "")))
        category = html_ascii(str(item.get("category", "")))
        venue_year = html_ascii(str(item.get("venueYear", "")))
        url = html_ascii(str(item.get("sourceUrl", "")) or "models.html")
        target = (
            ""
            if str(item.get("sourceUrl", "")).startswith(("models/", "./", "../"))
            else ' target="_blank" rel="noreferrer"'
        )

        rows.append(
            "\n".join(
                [
                    f'              <tr data-year="{year}">',
                    f"                <td>{name}</td>",
                    f"                <td>{category}</td>",
                    f"                <td>{venue_year}</td>",
                    f'                <td><a href="{url}"{target}>View model card</a></td>',
                    "              </tr>",
                ]
            )
        )

    return "\n".join(rows)


def refresh_models_page(models: list[dict[str, object]]) -> None:
    page = MODELS_PAGE_PATH.read_text(encoding="utf-8")
    rows = render_rows(models)
    updated = re.sub(
        r"(?s)(<tbody>\n).*?(\n            </tbody>)",
        rf"\1{rows}\2",
        page,
        count=1,
    )

    MODELS_PAGE_PATH.write_text(updated, encoding="utf-8")


def main() -> None:
    models = cleaned_models()
    export_models = [
        {key: value for key, value in item.items() if key != "citationCount"} for item in models
    ]

    JSON_PATH.write_text(json.dumps(export_models, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    refresh_models_page(models)
    print(f"Wrote {len(models)} cleaned models to {JSON_PATH.relative_to(ROOT)}")
    print(f"Updated {MODELS_PAGE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
