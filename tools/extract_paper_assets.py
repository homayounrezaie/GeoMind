#!/usr/bin/env python3
"""Extract paper-mentioned datasets, benchmarks, and code-backed models.

This is intentionally conservative. It creates traceable candidate rows from
local paper metadata and only emits model rows when a GitHub or Hugging Face
link is present on the paper.
"""
from __future__ import annotations

import csv
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

PAPERS = DATA / "papers.csv"
DATASETS = DATA / "datasets.csv"
BENCHMARKS = DATA / "benchmarks.csv"
MODELS = DATA / "foundation-models.csv"

NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

DATASET_SUFFIXES = (
    "dataset",
    "datasets",
    "benchmark",
    "benchmarks",
    "challenge",
    "challenges",
    "corpus",
    "archive",
)

TASK_RULES = [
    ("task_semantic_segmentation", "Semantic segmentation", r"\b(segmentation|segment|mask|land cover|land-cover|building footprint|road extraction|field boundary)\b"),
    ("task_object_detection", "Object detection", r"\b(object detection|detect|bounding box|aircraft|ship|vehicle|building detection|tree detection)\b"),
    ("task_change_detection", "Change detection", r"\b(change detection|change-detection|damage assessment|disaster|flood|earthquake|wildfire|burn scar)\b"),
    ("task_image_classification", "Image classification", r"\b(classification|classify|scene recognition|crop type|land use|land-use|lcz)\b"),
    ("task_super_resolution", "Super-resolution", r"\b(super-resolution|super resolution|downscaling|pan-sharpening|pansharpening)\b"),
    ("task_geo_localization", "Geo-localization", r"\b(geo-localization|geolocalization|visual place recognition|cross-view)\b"),
    ("task_depth_estimation", "Depth estimation", r"\b(depth|dem|elevation|height estimation)\b"),
]

DEFAULT_METRICS = {
    "task_semantic_segmentation": [
        ("mean_intersection_over_union", "Mean Intersection over Union", "mIoU", "true"),
        ("f1_score", "F1 Score", "F1", "true"),
    ],
    "task_object_detection": [
        ("mean_average_precision", "Mean Average Precision", "mAP", "true"),
        ("ap50", "Average Precision at IoU 0.50", "AP50", "true"),
    ],
    "task_change_detection": [
        ("f1_score", "F1 Score", "F1", "true"),
        ("mean_intersection_over_union", "Mean Intersection over Union", "mIoU", "true"),
    ],
    "task_image_classification": [
        ("overall_accuracy", "Overall Accuracy", "OA", "true"),
        ("f1_score", "F1 Score", "F1", "true"),
    ],
    "task_super_resolution": [
        ("peak_signal_to_noise_ratio", "Peak Signal-to-Noise Ratio", "PSNR", "true"),
        ("structural_similarity", "Structural Similarity", "SSIM", "true"),
    ],
    "task_geo_localization": [
        ("recall_at_1", "Recall@1", "R@1", "true"),
    ],
    "task_depth_estimation": [
        ("root_mean_squared_error", "Root Mean Squared Error", "RMSE", "false"),
    ],
}

GENERIC_DATASET_NAMES = {
    "dataset",
    "datasets",
    "benchmark",
    "benchmarks",
    "challenge",
    "challenges",
    "a large-scale dataset",
    "large-scale dataset",
    "remote sensing dataset",
    "satellite imagery dataset",
    "a benchmark dataset",
    "benchmark dataset",
    "new benchmark",
    "comprehensive benchmark",
    "multimodal dataset",
    "synthetic dataset",
    "novel dataset",
    "automatic dataset",
    "aerial image dataset",
    "global-scale dataset",
    "large-scale benchmark",
    "large-scale dataset",
    "pre-training datasets",
    "large and semantically diverse vision-language dataset",
    "opportunities and challenges",
    "advances and challenges",
}

GENERIC_LEADING_WORDS = {
    "advances",
    "assessing",
    "automatic",
    "benchmarking",
    "comprehensive",
    "creating",
    "dataset",
    "deep",
    "development",
    "evaluation",
    "generating",
    "improving",
    "in",
    "new",
    "novel",
    "on",
    "opportunities",
    "pre-training",
    "remote",
    "review",
    "synthetic",
    "toward",
    "towards",
    "using",
    "utilizing",
}

MODEL_KEYWORDS = re.compile(
    r"\b(model|foundation model|network|transformer|diffusion|framework|architecture|"
    r"segmenter|detector|classifier|mapper|retrieval|geolocalization|geo-localization)\b",
    re.I,
)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def append_rows(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    if not rows:
        return
    with path.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\r\n")
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def slug(value: str, limit: int = 90) -> str:
    value = clean(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:limit].strip("-") or "unknown"


def normalize(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def split_list(value: str) -> list[str]:
    parts = re.split(r"[;|]\s*|\s*,\s*(?=[A-Z0-9])", value or "")
    return [clean(part) for part in parts if clean(part)]


def pipe(items: list[str]) -> str:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        item = clean(item).replace("|", "/")
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return "|".join(out)


def paper_text(row: dict[str, str]) -> str:
    return " ".join(clean(row.get(field)) for field in ("title", "abstract", "uses_datasets"))


def title_case_name(value: str) -> str:
    value = clean(value).strip(" .,:;()[]{}")
    value = re.sub(r"^(?:the|a|an)\s+", "", value, flags=re.I)
    return value


def extract_dataset_names(row: dict[str, str]) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    for name in split_list(row.get("uses_datasets", "")):
        found.append((title_case_name(name), "uses_datasets"))

    text = paper_text(row)
    title = clean(row.get("title"))

    title_match = re.match(
        r"^(?P<name>[A-Z][A-Za-z0-9+_.\-/ ]{2,80}?):\s+.*\b(dataset|benchmark|challenge|corpus)\b",
        title,
        flags=re.I,
    )
    if title_match:
        found.append((title_case_name(title_match.group("name")), "title_prefix"))

    phrase_pattern = re.compile(
        r"\b((?:[A-Z0-9][A-Za-z0-9+_.\-/]*|[A-Z]{2,})(?:\s+(?:[A-Z0-9][A-Za-z0-9+_.\-/]*|for|of|and|in|the|to)){0,5}\s+"
        r"(?:Dataset|Datasets|Benchmark|Benchmarks|Challenge|Challenges|Corpus|Archive))\b"
    )
    for match in phrase_pattern.finditer(text):
        found.append((title_case_name(match.group(1)), "text_phrase"))

    compact_pattern = re.compile(r"\b([A-Z][A-Za-z0-9]*[-_]?(?:Bench|Net|Set|DB|Data|Challenge|Dataset|Corpus)\d*)\b")
    for match in compact_pattern.finditer(text):
        token = title_case_name(match.group(1))
        if len(token) >= 5:
            found.append((token, "named_token"))

    cleaned: list[tuple[str, str]] = []
    seen: set[str] = set()
    for name, source in found:
        name = re.sub(r"\s+", " ", name).strip(" .,:;()[]{}")
        if not name or len(name) > 100:
            continue
        normalized_name = normalize(name)
        if normalized_name in {normalize(item) for item in GENERIC_DATASET_NAMES}:
            continue
        if name.lower() in GENERIC_DATASET_NAMES:
            continue
        words = name.split()
        first_word = words[0].lower() if words else ""
        if source != "uses_datasets" and first_word in GENERIC_LEADING_WORDS:
            continue
        if source == "text_phrase":
            has_specific_signal = (
                bool(re.search(r"\d", name))
                or bool(re.search(r"\b[A-Z]{2,}[A-Za-z0-9-]*\b", name))
                or "-" in name
                or "/" in name
            )
            if not has_specific_signal:
                continue
            if len(words) > 7:
                continue
        if not any(suffix in name.lower() for suffix in DATASET_SUFFIXES) and source != "uses_datasets":
            continue
        key = normalized_name
        if key in seen:
            continue
        seen.add(key)
        cleaned.append((name, source))
    return cleaned[:6]


def infer_tasks(text: str) -> list[tuple[str, str]]:
    tasks = []
    lower = text.lower()
    for task_id, task_name, pattern in TASK_RULES:
        if re.search(pattern, lower):
            tasks.append((task_id, task_name))
    return tasks[:3]


def model_link(row: dict[str, str]) -> tuple[str, str]:
    for field in ("huggingface_url", "github_url", "code_url"):
        url = clean(row.get(field))
        if "huggingface.co/" in url:
            parsed = urlparse(url)
            bits = [bit for bit in parsed.path.split("/") if bit]
            if len(bits) >= 2:
                return "weights", f"https://huggingface.co/{bits[0]}/{bits[1]}"
            if bits:
                return "weights", f"https://huggingface.co/{bits[0]}"
        if "github.com/" in url:
            match = re.search(r"github\.com/([^/\s?#]+)/([^/\s?#]+)", url, flags=re.I)
            if match:
                return "code", f"https://github.com/{match.group(1)}/{match.group(2).removesuffix('.git')}"
    return "", ""


def extract_model_name(row: dict[str, str]) -> str:
    explicit = clean(row.get("introduces_models"))
    if explicit:
        return split_list(explicit)[0]
    title = clean(row.get("title"))
    if ":" in title:
        prefix = title.split(":", 1)[0].strip()
        if 2 <= len(prefix) <= 80 and not prefix.lower().startswith(("towards", "toward", "a ", "an ", "the ")):
            return prefix
    quoted = re.search(r"\b(?:called|named)\s+([A-Z][A-Za-z0-9+_.-]{2,40})\b", row.get("abstract", ""))
    if quoted:
        return quoted.group(1)
    return title[:120]


def model_category(text: str) -> str:
    lower = text.lower()
    if "foundation model" in lower or "pretrain" in lower:
        return "foundation_models"
    if "geo-localization" in lower or "geolocalization" in lower or "cross-view" in lower:
        return "vision_location"
    if "segmentation" in lower:
        return "segmentation"
    if "detection" in lower:
        return "object_detection"
    if "change detection" in lower:
        return "change_detection"
    if "super-resolution" in lower or "super resolution" in lower:
        return "super_resolution"
    return "paper_models"


def should_extract_model(row: dict[str, str], text: str) -> bool:
    if clean(row.get("introduces_models")):
        return True
    lower_title = clean(row.get("title")).lower()
    if re.search(r"\b(review|survey|bibliometric|tutorial|perspective|opportunities and challenges)\b", lower_title):
        return False
    if not MODEL_KEYWORDS.search(text):
        return False
    return bool(
        re.search(
            r"\b(we propose|we present|we introduce|this paper proposes|this paper presents|"
            r"novel|new|framework|network|model|transformer|diffusion|architecture)\b",
            text,
            flags=re.I,
        )
    )


def main() -> None:
    paper_fields, papers = read_csv(PAPERS)
    dataset_fields, dataset_rows = read_csv(DATASETS)
    benchmark_fields, benchmark_rows = read_csv(BENCHMARKS)
    model_fields, model_rows = read_csv(MODELS)

    existing_dataset_ids = {row["dataset_id"] for row in dataset_rows}
    existing_dataset_names = {normalize(row.get("name", "")) for row in dataset_rows}
    existing_benchmark_ids = {row["benchmark_id"] for row in benchmark_rows}
    existing_model_ids = {row["id"] for row in model_rows}
    existing_model_links = {clean(row.get("code_weights_url")) for row in model_rows if clean(row.get("code_weights_url"))}

    new_datasets: list[dict[str, str]] = []
    new_benchmarks: list[dict[str, str]] = []
    new_models: list[dict[str, str]] = []

    dataset_name_counter: Counter[str] = Counter()
    for paper in papers:
        text = paper_text(paper)
        tasks = infer_tasks(text)
        extracted_datasets = extract_dataset_names(paper)

        for dataset_name, source in extracted_datasets:
            dataset_name_counter[dataset_name] += 1
            dataset_id = f"paper-extracted/{slug(dataset_name)}"
            if dataset_id not in existing_dataset_ids and normalize(dataset_name) not in existing_dataset_names:
                tags = ["geospatial", "remote-sensing", "paper-derived", "needs-review", "paper-extracted"]
                if any(word in dataset_name.lower() for word in ("benchmark", "challenge")):
                    tags.append("benchmark")
                new_datasets.append(
                    {
                        "dataset_id": dataset_id,
                        "name": dataset_name,
                        "url": clean(paper.get("url") or paper.get("arxiv_url")),
                        "matched_terms": pipe(
                            [
                                "source:paper-extraction",
                                f"paper:{paper['id']}",
                                f"evidence:{source}",
                            ]
                        ),
                        "downloads": "0",
                        "likes": "0",
                        "trending_score": "0",
                        "last_modified": NOW,
                        "created_at": NOW,
                        "task_categories": pipe([task_name.lower().replace(" ", "-") for _, task_name in tasks]),
                        "task_ids": pipe([task_id.removeprefix("task_").replace("_", "-") for task_id, _ in tasks]),
                        "size_categories": "",
                        "languages": "",
                        "tags": pipe(tags),
                        "description": (
                            f"Paper-extracted dataset/resource candidate from {paper['id']}: {paper.get('title')}. "
                            f"Evidence source: {source}. Review before treating as a verified canonical dataset."
                        )[:700],
                    }
                )
                existing_dataset_ids.add(dataset_id)
                existing_dataset_names.add(normalize(dataset_name))

            for task_id, task_name in tasks:
                for metric_id, metric_name, metric_abbr, higher in DEFAULT_METRICS.get(task_id, [])[:2]:
                    benchmark_id = "paper_extracted_" + slug(f"{paper['id']} {task_id} {dataset_name} {metric_id}", 140)
                    if benchmark_id in existing_benchmark_ids:
                        continue
                    new_benchmarks.append(
                        {
                            "benchmark_id": benchmark_id,
                            "paper_id": paper["id"],
                            "task_id": task_id,
                            "task_name": task_name,
                            "dataset_id": f"paper-extracted/{slug(dataset_name)}",
                            "dataset_name": dataset_name,
                            "metric_id": metric_id,
                            "metric_name": metric_name,
                            "metric_abbreviation": metric_abbr,
                            "higher_is_better": higher,
                            "split": "",
                            "score_value": "",
                            "score_unit": "",
                            "status": "candidate",
                            "evidence": (
                                f"Paper text links task '{task_name}' with extracted dataset/resource '{dataset_name}'. "
                                "Metric is inferred from task family; no score extracted."
                            ),
                            "evidence_source": pipe(["source:paper-extraction", f"paper:{paper['id']}", f"dataset_evidence:{source}"]),
                            "confidence": "0.35",
                            "extraction_method": "paper_text_candidate",
                        }
                    )
                    existing_benchmark_ids.add(benchmark_id)

        link_label, link = model_link(paper)
        if link and link not in existing_model_links and should_extract_model(paper, text):
            name = extract_model_name(paper)
            model_id = f"paper_model_{slug(name or paper['id'], 80)}"
            if model_id in existing_model_ids:
                model_id = f"{model_id}_{slug(paper['id'], 24)}"
            if model_id in existing_model_ids:
                continue
            new_models.append(
                {
                    "id": model_id,
                    "year": clean(paper.get("year")) or "unknown",
                    "title": clean(paper.get("title")),
                    "authors": clean(paper.get("authors")),
                    "venue": clean(paper.get("venue")),
                    "category": model_category(text),
                    "publication_type": "paper_code",
                    "doi": clean(paper.get("doi")),
                    "arxiv_id": clean((paper.get("arxiv_url") or "").rstrip("/").split("/")[-1] if paper.get("arxiv_url") else ""),
                    "url": clean(paper.get("url") or paper.get("arxiv_url") or paper.get("project_url")),
                    "open_pdf_url": clean(paper.get("pdf_url")),
                    "citation_count": clean(paper.get("citation_count")),
                    "source": "paper-extraction",
                    "source_query": f"paper:{paper['id']}",
                    "status": "candidate_model",
                    "notes": (
                        f"Paper-derived model candidate with required public {link_label} link. "
                        f"Extracted from papers.csv row {paper['id']}; review model naming/scope before citing."
                    ),
                    "abbreviation": clean(name),
                    "paper_label": "Paper",
                    "paper_url": clean(paper.get("url") or paper.get("arxiv_url")),
                    "code_weights_label": "Hugging Face" if "huggingface.co/" in link else "GitHub",
                    "code_weights_url": link,
                    "awesome_section": "Paper-derived code-backed models",
                }
            )
            existing_model_ids.add(model_id)
            existing_model_links.add(link)

    append_rows(DATASETS, dataset_fields, new_datasets)
    append_rows(BENCHMARKS, benchmark_fields, new_benchmarks)
    append_rows(MODELS, model_fields, new_models)

    print(
        "extracted "
        f"datasets={len(new_datasets)} benchmarks={len(new_benchmarks)} models={len(new_models)} "
        f"from papers={len(papers)}"
    )
    print(f"top_dataset_mentions={dataset_name_counter.most_common(10)}")


if __name__ == "__main__":
    main()
