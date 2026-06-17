"""Promote candidate datasets into the clean data/datasets.json index.

Subcommands:
  select            Build data/_promote/selection.json: dataset candidates not
                    already in datasets.json, prioritized (high-signal first).
  validate <file>   Validate a batch (or the clean index) against the clean schema.
  merge <glob...>   Validate staged draft files, dedup, append to datasets.json.

The clean schema (mirrors scripts/test_clean_datasets.py):
  required: id (kebab-case, unique), name, summary, description, task,
            links (dict, >=1 http url)
  optional: modality, size, numSamples, license, year, sources, versions[]
"""

import glob as globmod
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CLEAN = DATA / "datasets.json"
CANDIDATES = DATA / "datasets.candidate.json"
PROMOTE = DATA / "_promote"
SELECTION = PROMOTE / "selection.json"

SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HTTP = re.compile(r"^https?://", re.IGNORECASE)
REQUIRED = ("id", "name", "summary", "description", "task", "links")
ALLOWED = {
    "id", "name", "summary", "description", "task", "modality", "size",
    "numSamples", "license", "year", "sources", "versions", "links",
}
AUTH = {
    "TorchGeo", "TFDS", "GEO-Bench", "Planetary Computer",
    "satellite-image-deep-learning", "TerraTorch", "user-supplied",
}


def norm(value):
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def load(path):
    d = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(d, dict):
        return d.get("datasets") or d.get("candidates") or d.get("records") or []
    return d


def _high_signal(c):
    srcs = c.get("sources", []) or []
    authoritative = any(s in AUTH or s.startswith(("arxiv:", "ieee:")) for s in srcs)
    return bool(c.get("known")) or authoritative or len(srcs) > 1


def select():
    cands = [c for c in load(CANDIDATES) if c.get("type", "dataset") == "dataset"]
    clean = load(CLEAN)
    existing = {norm(d["id"]) for d in clean} | {norm(d["name"]) for d in clean}
    todo = [
        c for c in cands
        if norm(c.get("id")) not in existing and norm(c.get("name")) not in existing
    ]
    todo.sort(key=lambda c: (not _high_signal(c), -(c.get("downloads") or 0), norm(c.get("name"))))
    PROMOTE.mkdir(exist_ok=True)
    SELECTION.write_text(json.dumps(todo, indent=1), encoding="utf-8")
    hs = sum(1 for c in todo if _high_signal(c))
    print(f"selection.json -> {len(todo)} to promote "
          f"(already in clean: {len(cands) - len(todo)}); high-signal first: {hs}")


def validate(entries, existing_ids=None):
    errs = []
    seen = set(existing_ids or [])
    for i, e in enumerate(entries):
        tag = e.get("id") or f"#{i}"
        for f in REQUIRED:
            if not e.get(f):
                errs.append(f"{tag}: missing {f}")
        idv = e.get("id", "")
        if idv and not SLUG.match(idv):
            errs.append(f"{tag}: id {idv!r} not kebab-case")
        if idv in seen:
            errs.append(f"{tag}: duplicate id")
        seen.add(idv)
        links = e.get("links")
        if isinstance(links, dict) and links:
            for k, v in links.items():
                if not HTTP.match(str(v)):
                    errs.append(f"{tag}: link {k} not an http url")
        else:
            errs.append(f"{tag}: links missing/empty")
        for v in e.get("versions") or []:
            if not v.get("name"):
                errs.append(f"{tag}: version missing name")
            if v.get("url") and not HTTP.match(str(v["url"])):
                errs.append(f"{tag}: version url not http")
    return errs


def merge(globs):
    existing = load(CLEAN)
    ex_ids = {d["id"] for d in existing}
    seen = {norm(d["id"]) for d in existing} | {norm(d["name"]) for d in existing}
    staged = []
    for g in globs:
        for f in sorted(globmod.glob(g)):
            staged += load(f)

    kept = []
    for e in staged:
        e = {k: v for k, v in e.items() if k in ALLOWED}
        key = norm(e.get("id") or e.get("name"))
        if not key or key in seen:
            continue
        seen.add(key)
        kept.append(e)

    errs = validate(kept, existing_ids=ex_ids)
    if errs:
        print(f"VALIDATION FAILED ({len(errs)} errors):")
        for e in errs[:60]:
            print("  -", e)
        sys.exit(1)

    merged = existing + kept
    CLEAN.write_text(json.dumps({"datasets": merged}, indent=2), encoding="utf-8")
    print(f"merged {len(kept)} new datasets -> datasets.json now {len(merged)} (was {len(existing)})")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "select"
    if cmd == "select":
        select()
    elif cmd == "validate":
        errs = validate(load(sys.argv[2]))
        print("OK" if not errs else "\n".join(errs[:60]))
    elif cmd == "merge":
        merge(sys.argv[2:])
    else:
        sys.exit(f"unknown command: {cmd}")
