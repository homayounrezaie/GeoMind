#!/usr/bin/env python3
"""Recover dropped GeoAI model rows when a real code/weights link exists.

This compares the current ``data/foundation-models.csv`` to an older git ref,
then restores rows that can be represented as actual models/code resources:
GitHub repositories or Hugging Face model pages. It deliberately avoids
restoring paper-only placeholders.
"""
from __future__ import annotations

import argparse
import csv
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "foundation-models.csv"

GEO_RE = re.compile(
    r"remote sensing|earth observation|geospatial|geoai|satellite|aerial|uav|"
    r"drone|sar\b|hyperspectral|multispectral|sentinel|landsat|weather|"
    r"climate|earth|urban|osm\b|geolog|flood|wildfire|land cover|crop|soil|"
    r"ocean|marine|coastal|cross-view|geo-localization|geolocation",
    re.I,
)
OUT_OF_DOMAIN_RE = re.compile(
    r"medical|clinical|biomed|healthcare|oncology|pathology|protein|drug|"
    r"therapeutic|molecular|speech|finance|materials|cell|blood|medicine|"
    r"electrocatalyst",
    re.I,
)
MODEL_SIGNAL_RE = re.compile(
    r"foundation model|vision[- ]language model|large vision language model|"
    r"multimodal large language model|agent|gpt|llava|vlm|clip|sam\b|mae\b|"
    r"diffusion|encoder|transformer|tokenizer|pretrain|pre-trained|"
    r"segmentation model|generation model|chatgpt|chat|bot|remoteclip|"
    r"terramind|presto|galileo|tessera|olmoearth",
    re.I,
)
ARTIFACT_RE = re.compile(r"^(link|paper|code|pdf|star|last commit|github stars|home|category)$", re.I)

# Links found by targeted GitHub searches during recovery. Most of these were
# already present after earlier ingestion, but keeping the overrides makes the
# recovery deterministic when the old row lacked a code URL.
MANUAL_LINKS = {
    "SARCLIP": "https://github.com/CAESAR-Radi/SARCLIP",
    "Text2Earth": "https://github.com/Chen-Yang-Liu/Text2Earth",
    "GeoCLIP": "https://github.com/VicenteVivan/geo-clip",
    "SkySense": "https://github.com/Jack-bo1220/SkySense",
    "Prithvi-EO-2.0": "https://github.com/NASA-IMPACT/Prithvi-EO-2.0",
    "Prithvi WxC": "https://github.com/NASA-IMPACT/Prithvi-WxC",
}


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def real_model_link(url: str) -> bool:
    url = (url or "").split(";")[0].strip()
    if url.startswith("https://github.com/"):
        return True
    return url.startswith("https://huggingface.co/") and "/papers/" not in url and "/datasets/" not in url


def read_current() -> tuple[list[str], list[dict[str, str]]]:
    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def read_from_ref(ref: str) -> list[dict[str, str]]:
    content = subprocess.check_output(["git", "show", f"{ref}:data/foundation-models.csv"], cwd=ROOT, text=True)
    return list(csv.DictReader(content.splitlines()))


def manual_link_for(row: dict[str, str]) -> str:
    haystack = " ".join([row.get("abbreviation", ""), row.get("title", "")]).lower()
    for key, url in MANUAL_LINKS.items():
        if key.lower() in haystack:
            return url
    return ""


def should_restore(row: dict[str, str], link: str) -> bool:
    title = (row.get("title") or "").strip()
    if not title or ARTIFACT_RE.match(title):
        return False
    text = " ".join(str(value) for value in row.values() if value)
    if OUT_OF_DOMAIN_RE.search(text) and not GEO_RE.search(text):
        return False
    if not GEO_RE.search(text):
        return False
    if not MODEL_SIGNAL_RE.search(text):
        return False
    if not real_model_link(link):
        return False
    if "dataset" in title.lower() and "foundation model" not in title.lower():
        return False
    # Benchmark-only rows belong in benchmarks, not the model catalogue.
    if row.get("status") == "candidate_benchmark":
        return bool(re.match(r"RSGPT\b", title, re.I))
    return True


def recovered_row(row: dict[str, str], fields: list[str], link: str, source: str) -> dict[str, str]:
    link = link.split(";")[0].strip()
    out = {field: row.get(field, "") for field in fields}
    out["status"] = "candidate_tokenizer" if row.get("status") == "candidate_tokenizer" else "candidate_model"
    out["code_weights_url"] = link
    out["code_weights_label"] = "Weights" if link.startswith("https://huggingface.co/") else "Code"
    out["source"] = row.get("source") or source
    out["source_query"] = row.get("source_query") or source
    note = row.get("notes", "").strip()
    recovery_note = f"Recovered after dropped-model link audit; verified public {out['code_weights_label'].lower()} link."
    out["notes"] = f"{note} {recovery_note}".strip()
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-ref", default="HEAD~1", help="git ref containing the pre-clean model CSV")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    fields, current = read_current()
    old_rows = read_from_ref(args.source_ref)

    current_ids = {row.get("id", "") for row in current}
    current_urls = {row.get("code_weights_url", "") for row in current}
    current_titles = {normalize(row.get("title", "")) for row in current}

    additions: list[dict[str, str]] = []
    seen_urls = set(current_urls)
    seen_titles = set(current_titles)

    for row in old_rows:
        if row.get("id") in current_ids:
            continue
        link = row.get("code_weights_url", "").strip()
        source = "existing public link"
        if not real_model_link(link):
            link = manual_link_for(row)
            source = "targeted GitHub search"
        title_key = normalize(row.get("title", ""))
        if link in seen_urls or title_key in seen_titles:
            continue
        if not should_restore(row, link):
            continue
        additions.append(recovered_row(row, fields, link, source))
        seen_urls.add(link)
        seen_titles.add(title_key)

    print(f"recoverable model rows: {len(additions)}")
    for row in additions:
        print(f"  {row.get('title')} -> {row.get('code_weights_url')}")

    if args.dry_run or not additions:
        return

    with CSV_PATH.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\r\n")
        for row in additions:
            writer.writerow({field: row.get(field, "") for field in fields})


if __name__ == "__main__":
    main()
