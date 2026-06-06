#!/usr/bin/env python3
"""Clean the raw paper CSV and refresh the papers catalog."""

from __future__ import annotations

import csv
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw" / "papers.csv"
TOPICS_PATH = ROOT / "data" / "paper-topics.json"
JSON_PATH = ROOT / "data" / "papers.json"
PAPERS_PAGE_PATH = ROOT / "pages" / "papers.html"
INDEX_PATH = ROOT / "index.html"
MAX_YEAR = 2026
FALLBACK_ROW_COUNT = 20
HOME_ROW_COUNT = 3

GENERIC_TITLE_KEYS = {
    "",
    "arxiv",
    "code",
    "doi",
    "github",
    "homepage",
    "link",
    "paper",
    "papers",
    "pdf",
    "project",
    "repository",
    "source",
    "supplementary",
    "view",
}

GEO_TERMS = (
    "aerial",
    "agricultural",
    "agriculture",
    "airport",
    "building extraction",
    "building footprint",
    "cartograph",
    "change detection",
    "climate",
    "cloud detection",
    "copernicus",
    "crop",
    "deforestation",
    "disaster",
    "drone",
    "earth observation",
    "earth-observation",
    "earth surface",
    "earthquake",
    "flood",
    "forest",
    "geoai",
    "geographic",
    "geoinformation",
    "geospatial",
    "geo-spatial",
    "gis",
    "glacier",
    "hyperspectral",
    "insar",
    "land cover",
    "land-cover",
    "land use",
    "land-use",
    "landsat",
    "lidar",
    "map",
    "mapping",
    "modis",
    "multispectral",
    "ndvi",
    "overhead imagery",
    "pan-sharpening",
    "pansharpening",
    "photogrammetry",
    "planet imagery",
    "polsar",
    "precipitation",
    "remote sensing",
    "remote-sensing",
    "road extraction",
    "road network",
    "runway",
    "sar",
    "satellite",
    "sea ice",
    "sentinel",
    "ship detection",
    "soil moisture",
    "spatial image",
    "spatio-temporal",
    "spatiotemporal",
    "synthetic aperture radar",
    "traffic",
    "uav",
    "urban",
    "vegetation",
    "viirs",
    "weather",
    "wildfire",
    "worldview",
)

STRONG_GEO_TERMS = (
    "aerial",
    "earth observation",
    "geoai",
    "geospatial",
    "hyperspectral",
    "insar",
    "landsat",
    "lidar",
    "multispectral",
    "overhead imagery",
    "photogrammetry",
    "polsar",
    "remote sensing",
    "sar",
    "satellite",
    "sentinel",
    "synthetic aperture radar",
    "uav",
)

ASTRONOMY_TERMS = (
    "alma telescope",
    "astronom",
    "cosmolog",
    "galaxy",
    "hubble",
    "jwst",
    "nirspec",
    "telescope",
)

BIOMEDICAL_TERMS = (
    "bio medical",
    "biomedical",
    "cancer",
    "camouflaged object",
    "clinical",
    "ct data",
    "healthcare",
    "histopathology",
    "medical",
    "mri",
    "oncology",
    "patient",
    "polyp",
    "tumor",
    "tumour",
    "x ray",
    "x-ray",
)

BIOMEDICAL_GEO_ALLOW_TERMS = (
    "geographic",
    "geospatial",
    "satellite",
)

SOURCE_WRAPPER_TERMS = (
    "awesome",
    "github",
    "hugging face papers",
    "paper list",
    "papers list",
)

VENUE_FILTERS = (
    ("", "All venues"),
    ("cvpr", "CVPR"),
    ("iccv", "ICCV"),
    ("eccv", "ECCV"),
    ("neurips", "NeurIPS"),
    ("icml", "ICML"),
    ("iclr", "ICLR"),
    ("aaai", "AAAI"),
    ("ijcai", "IJCAI"),
    ("arxiv", "arXiv"),
    ("ieee", "IEEE"),
    ("remote-sensing", "Remote Sensing"),
    ("isprs", "ISPRS"),
    ("nature", "Nature"),
    ("other", "Other"),
)

VENUE_PATTERNS = (
    (r"\bcvpr\b|computer vision and pattern recognition", "CVPR", "cvpr"),
    (r"\biccv\b|international conference on computer vision", "ICCV", "iccv"),
    (r"\beccv\b|european conference on computer vision", "ECCV", "eccv"),
    (r"\bneurips\b|neural information processing systems", "NeurIPS", "neurips"),
    (r"\bicml\b|international conference on machine learning", "ICML", "icml"),
    (r"\biclr\b|learning representations", "ICLR", "iclr"),
    (r"\baaai\b|artificial intelligence", "AAAI", "aaai"),
    (r"\bijcai\b", "IJCAI", "ijcai"),
    (r"\bacm mm\b|multimedia", "ACM MM", "other"),
    (r"\bigarss\b", "IGARSS", "ieee"),
    (r"\btgrs\b|transactions on geoscience and remote sensing", "IEEE TGRS", "ieee"),
    (
        r"\bjstars\b|selected topics in applied earth observations and remote sensing",
        "IEEE JSTARS",
        "ieee",
    ),
    (r"\bgrsl\b|geoscience and remote sensing letters", "IEEE GRSL", "ieee"),
    (r"\bieee\b", "IEEE", "ieee"),
    (r"\bisprs journal of photogrammetry", "ISPRS JPRS", "isprs"),
    (r"\bisprs international journal of geo-information", "ISPRS IJGI", "isprs"),
    (r"\bisprs\b", "ISPRS", "isprs"),
    (r"\binternational journal of applied earth observation", "IJAEOG", "other"),
    (r"\bremote sensing\b", "Remote Sensing", "remote-sensing"),
    (r"\bscientific data\b", "Scientific Data", "nature"),
    (r"\bscientific reports\b", "Scientific Reports", "nature"),
    (r"\bnature\b", "Nature", "nature"),
    (r"\bsensors\b", "Sensors", "other"),
    (r"\bieee access\b", "IEEE Access", "ieee"),
)

TOPIC_RULES = (
    (("change detection",), "Change Detection"),
    (("super-resolution", "super resolution", "pansharpen", "pan-sharpen"), "Image Super-Resolution"),
    (("self-supervised", "self supervised", "masked autoencoder", "pre training", "pre-training", "contrastive"), "Self-Supervised Learning"),
    (("object detection", "target detection", "ship detection", "vehicle detection"), "Object Detection"),
    (("segmentation", "segment anything", "mask r-cnn", "sam "), "Segmentation"),
    (("vision-language", "vision language", "vlm", "visual question answering", "image-text"), "Vision-Language Models (VLMs)"),
    (("large language model", " llm", "llm "), "Large Language Models (LLMs)"),
    (("foundation model", "generalist", "promptable"), "Foundation Models"),
    (("diffusion",), "Diffusion Models"),
    (("generative", " gan", "adversarial"), "Generative Models"),
    (("graph neural", "gnn", "graph convolution"), "Graph Neural Networks (GNNs)"),
    (("semi-supervised", "semi supervised"), "Semi-Supervised Learning"),
    (("few-shot", "few shot", "zero-shot", "zero shot"), "Few-Shot Learning"),
    (("domain adaptation",), "Domain Adaptation"),
    (("transfer learning",), "Transfer Learning"),
    (("knowledge distillation",), "Knowledge Distillation"),
    (("transformer", "attention"), "Transformer Models"),
    (("vision transformer", " vit", "vit "), "Vision Transformers (ViTs)"),
    (("reinforcement learning",), "Reinforcement Learning"),
    (("time series", "time-series", "temporal", "spatiotemporal", "spatio-temporal"), "Time Series"),
    (("classification", "land cover", "land-cover"), "Classification"),
    (("climate", "weather", "precipitation"), "Climate and Weather"),
    (("crop", "agriculture", "vegetation", "forest"), "Agriculture and Environment"),
)

LOCAL_PAPER_LINKS = {
    "satmae pre training transformers for temporal and multi spectral satellite imagery": "papers/satmae.html",
}

HOME_TITLE_PATTERNS = (
    "satmae pre training transformers",
    "segment anything from space",
    "cross scale mae",
)

CURATED_PAPERS = [
    {
        "id": "ieee_11540094",
        "title": "IEEE Xplore Document 11540094",
        "topic": "Remote Sensing",
        "venueYear": "IEEE 2026",
        "venue": "IEEE",
        "venueKey": "ieee",
        "year": 2026,
        "sourceUrl": "https://ieeexplore.ieee.org/document/11540094",
        "citationCount": 0,
        "doi": "",
        "rawPaperId": "curated_ieee_11540094",
        "searchText": "IEEE Xplore Document 11540094 Remote Sensing IEEE 2026",
    },
]


def clean_text(value: str) -> str:
    value = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", value or "")
    value = re.sub(r"\s+", " ", value).strip()
    return value.strip(" -_|")


def normalize_title(value: str) -> str:
    value = clean_text(value)
    value = re.sub(r"^\*+\s*(.*?)\s*\*+$", r"\1", value)
    value = re.sub(r"^#+\s*", "", value)
    return value.strip(" \"'")


def key_for(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def slug_for(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (value or "").lower()).strip("_")


def html_text(value: object) -> str:
    escaped = html.escape(str(value), quote=False)
    return escaped.encode("ascii", "xmlcharrefreplace").decode("ascii")


def parse_year(value: str) -> int:
    match = re.search(r"\b(19\d{2}|20\d{2})\b", value or "")
    if not match:
        return 0

    year = int(match.group(1))
    return year if 1900 <= year <= MAX_YEAR else 0


def extract_year(row: dict[str, str]) -> int:
    for field in ("year", "doi", "arxiv_url", "url", "pdf_url", "project_url"):
        year = parse_year(row.get(field, ""))
        if year:
            return year

    return 0


def parse_int(value: str) -> int:
    try:
        return int(value or "0")
    except ValueError:
        return 0


def combined_text(row: dict[str, str], fields: tuple[str, ...]) -> str:
    return " ".join(row.get(field, "") or "" for field in fields)


def term_count(text: str, terms: tuple[str, ...]) -> int:
    return sum(1 for term in terms if term in text)


def has_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def is_source_wrapper_venue(venue: str) -> bool:
    venue_key = key_for(venue)

    if not venue_key:
        return False
    if any(term in venue_key for term in SOURCE_WRAPPER_TERMS):
        return True
    return bool(re.match(r"^[a-z0-9_.-]+/[a-z0-9_.-]+", (venue or "").lower()))


def should_include(row: dict[str, str]) -> bool:
    title = normalize_title(row.get("title", ""))
    title_key = key_for(title)
    venue = clean_text(row.get("venue", ""))
    title_text = key_for(title)
    venue_text = key_for(venue)
    abstract_text = key_for(row.get("abstract", ""))
    semantic_text = " ".join((title_text, venue_text, abstract_text))

    if title_key in GENERIC_TITLE_KEYS:
        return False
    if len(title) < 8 or len(title) > 220:
        return False
    if not choose_source_url(row):
        return False
    if re.search(r"\b(awesome|github repository|paper list|leaderboard|dataset card)\b", title_text):
        return False

    title_has_geo = has_any(title_text, GEO_TERMS)
    venue_has_geo = has_any(venue_text, GEO_TERMS) and not is_source_wrapper_venue(venue)
    abstract_geo_count = term_count(abstract_text, GEO_TERMS)

    if not (title_has_geo or venue_has_geo or abstract_geo_count >= 2):
        return False

    if has_any(semantic_text, ASTRONOMY_TERMS) and not has_any(semantic_text, STRONG_GEO_TERMS):
        return False
    if has_any(semantic_text, BIOMEDICAL_TERMS) and not has_any(
        " ".join((title_text, venue_text)), BIOMEDICAL_GEO_ALLOW_TERMS
    ):
        return False

    return True


def normalize_venue(row: dict[str, str]) -> tuple[str, str]:
    raw = clean_text(row.get("venue", ""))
    raw_key = key_for(raw)

    if not raw or is_source_wrapper_venue(raw):
        return "", "other"

    if raw_key in {"arxiv", "arxiv org", "arxiv cornell university"}:
        return "arXiv", "arxiv"
    if raw_key in {"preprints org", "research square", "ssrn electronic journal", "techrxiv"}:
        return raw.replace(".org", "").replace("Electronic Journal", "").strip(), "other"

    for pattern, label, venue_key in VENUE_PATTERNS:
        if re.search(pattern, raw_key):
            return label, venue_key

    if len(raw) > 72 or raw.count("/") > 1:
        return "", "other"

    return raw, "other"


def normalize_venue_year(row: dict[str, str], year: int) -> tuple[str, str]:
    venue, venue_key = normalize_venue(row)

    if venue and year:
        return f"{venue} {year}", venue_key
    if year:
        return str(year), venue_key
    if venue:
        return venue, venue_key
    return "Undated", venue_key


def normalize_topic(row: dict[str, str]) -> str:
    text = key_for(combined_text(row, ("title", "abstract")))

    for needles, label in TOPIC_RULES:
        if any(needle in text for needle in needles):
            return label

    return "Remote Sensing"


def choose_source_url(row: dict[str, str]) -> str:
    title_key = key_for(row.get("title", ""))

    if title_key in LOCAL_PAPER_LINKS:
        return LOCAL_PAPER_LINKS[title_key]

    for field in ("arxiv_url",):
        url = clean_text(row.get(field, ""))
        if url.startswith(("http://", "https://")):
            return url

    doi = clean_text(row.get("doi", ""))
    if doi:
        return f"https://doi.org/{doi}"

    for field in ("url", "pdf_url", "project_url", "github_url", "huggingface_url", "code_url"):
        url = clean_text(row.get(field, ""))
        if url.startswith(("http://", "https://")):
            return url

    return ""


def venue_rank(row: dict[str, str]) -> int:
    venue, venue_key = normalize_venue(row)

    if venue_key in {"cvpr", "iccv", "eccv", "neurips", "icml", "iclr", "aaai", "ijcai"}:
        return 100
    if venue_key in {"ieee", "isprs", "nature", "remote-sensing"}:
        return 82
    if venue:
        return 62
    if choose_source_url(row):
        return 40
    return 0


def clean_rows(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    selected = [row for row in rows if should_include(row)]
    deduped: dict[str, tuple[tuple[int, int, int], dict[str, str]]] = {}

    for row in selected:
        title_key = key_for(row.get("title", ""))
        score = (
            venue_rank(row),
            parse_int(row.get("citation_count", "")),
            extract_year(row),
        )

        if title_key not in deduped or score > deduped[title_key][0]:
            deduped[title_key] = (score, row)

    cleaned: list[dict[str, object]] = []
    used_ids: set[str] = set()

    for _, row in deduped.values():
        title = normalize_title(row.get("title", ""))
        year = extract_year(row)
        venue_year, venue_key = normalize_venue_year(row, year)
        source_url = choose_source_url(row)
        base_id = slug_for(row.get("id", "") or title)
        paper_id = base_id or f"paper_{len(used_ids) + 1}"
        suffix = 2

        while paper_id in used_ids:
            paper_id = f"{base_id}_{suffix}"
            suffix += 1

        used_ids.add(paper_id)
        topic = normalize_topic(row)

        cleaned.append(
            {
                "id": paper_id,
                "title": title,
                "topic": topic,
                "venueYear": venue_year,
                "venue": normalize_venue(row)[0],
                "venueKey": venue_key,
                "year": year,
                "sourceUrl": source_url,
                "citationCount": parse_int(row.get("citation_count", "")),
                "doi": clean_text(row.get("doi", "")),
                "rawPaperId": row.get("id", ""),
                "searchText": clean_text(
                    " ".join(
                        (
                            title,
                            row.get("authors", ""),
                            topic,
                            venue_year,
                            row.get("doi", ""),
                        )
                    )
                ),
            }
        )

    existing_ids = {str(row["id"]) for row in cleaned}
    existing_urls = {str(row["sourceUrl"]) for row in cleaned}

    for row in CURATED_PAPERS:
        if row["id"] in existing_ids or row["sourceUrl"] in existing_urls:
            continue

        cleaned.append(row)
        existing_ids.add(str(row["id"]))
        existing_urls.add(str(row["sourceUrl"]))

    cleaned.sort(
        key=lambda row: (
            int(row["year"]),
            int(row["citationCount"]),
            str(row["title"]).lower(),
        ),
        reverse=True,
    )
    return cleaned


def render_link(url: str, root_relative: bool = False) -> str:
    href = url

    if root_relative and url.startswith("papers/"):
        href = f"pages/{url}"

    escaped_url = html.escape(href, quote=True)
    target = ' target="_blank" rel="noreferrer"' if href.startswith(("http://", "https://")) else ""
    return f'<a href="{escaped_url}"{target}>View paper card</a>'


def render_rows(rows: list[dict[str, object]], root_relative: bool = False) -> str:
    rendered: list[str] = []

    for row in rows:
        rendered.append(
            "\n".join(
                [
                    f'              <tr data-venue="{html.escape(str(row["venueKey"]), quote=True)}" data-year="{int(row["year"])}">',
                    f"                <td>{html_text(row['title'])}</td>",
                    f"                <td>{html_text(row['topic'])}</td>",
                    f"                <td>{html_text(row['venueYear'])}</td>",
                    f"                <td>{render_link(str(row['sourceUrl']), root_relative=root_relative)}</td>",
                    "              </tr>",
                ]
            )
        )

    return "\n".join(rendered)


def home_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    chosen: list[dict[str, object]] = []

    for pattern in HOME_TITLE_PATTERNS:
        match = next((row for row in rows if pattern in key_for(str(row["title"]))), None)
        if match and match not in chosen:
            chosen.append(match)

    for row in rows:
        if len(chosen) >= HOME_ROW_COUNT:
            break
        if row not in chosen:
            chosen.append(row)

    return chosen[:HOME_ROW_COUNT]


def render_filter_options() -> str:
    return "\n".join(
        f'              <option value="{html.escape(value, quote=True)}">{html_text(label)}</option>'
        for value, label in VENUE_FILTERS
    )


def replace_between(text: str, start_pattern: str, end_pattern: str, replacement: str) -> str:
    pattern = re.compile(f"({start_pattern})(.*?)({end_pattern})", re.S)
    return pattern.sub(lambda match: f"{match.group(1)}{replacement}{match.group(3)}", text, count=1)


def update_papers_page(rows: list[dict[str, object]]) -> None:
    page = PAPERS_PAGE_PATH.read_text()
    page = page.replace(
        '<div class="resource-controls paper-controls" data-resource-list>',
        '<div class="resource-controls paper-controls" data-resource-list data-resource-src="../data/papers.json">',
    )
    page = replace_between(
        page,
        r'<select data-venue-filter>\n',
        r"\n\s*</select>",
        render_filter_options(),
    )
    page = page.replace("<th scope=\"col\">Paper title</th>", '<th scope="col" data-field="title">Paper title</th>')
    page = page.replace("<th scope=\"col\">Topic</th>", '<th scope="col" data-field="topic">Topic</th>')
    page = page.replace(
        "<th scope=\"col\">Venue / Year</th>",
        '<th scope="col" data-field="venueYear">Venue / Year</th>',
    )
    page = page.replace(
        '<th scope="col"><span class="visually-hidden">Link</span></th>',
        '<th scope="col" data-field="sourceUrl" data-link-field="true">View paper card</th>',
    )
    page = replace_between(page, r"<tbody>\n", r"\n\s*</tbody>", render_rows(rows[:FALLBACK_ROW_COUNT]))
    PAPERS_PAGE_PATH.write_text(page)


def update_home(rows: list[dict[str, object]]) -> None:
    page = INDEX_PATH.read_text()
    label = f"{len(rows):,} papers"
    page = re.sub(
        r'Papers <span class="section-count">[^<]+</span>',
        f'Papers <span class="section-count">{label}</span>',
        page,
        count=1,
    )
    page = replace_between(
        page,
        r'<section\s+class="content-section resource-panel"\s+id="papers".*?<tbody>\n',
        r"\n\s*</tbody>",
        render_rows(home_rows(rows), root_relative=True),
    )
    INDEX_PATH.write_text(page)


def main() -> None:
    if not RAW_PATH.exists():
        raise SystemExit(f"Missing raw paper export: {RAW_PATH}")
    if not TOPICS_PATH.exists():
        raise SystemExit(f"Missing paper topic taxonomy: {TOPICS_PATH}")

    with RAW_PATH.open(newline="", encoding="utf-8") as source:
        raw_rows = list(csv.DictReader(source))

    rows = clean_rows(raw_rows)
    JSON_PATH.write_text(json.dumps(rows, indent=2) + "\n")
    update_papers_page(rows)
    update_home(rows)
    print(f"Wrote {len(rows)} cleaned papers")


if __name__ == "__main__":
    main()
