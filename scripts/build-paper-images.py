#!/usr/bin/env python3
"""Generate data/paper-images.json from the files in images/papers/.

Drop an image named after a paper id (e.g. cohff-2024.png) and run this script
(the pre-commit hook does it automatically). Additional images use a numeric
suffix: cohff-2024-1.png, cohff-2024-2.png, ...

Images are matched against the real paper ids in data/papers.json, so the year
suffix in an id (-2024, _2022) is never mistaken for an image index.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAPERS = ROOT / "data" / "papers.json"
IMAGES_DIR = ROOT / "images" / "papers"
OUTPUT = ROOT / "data" / "paper-images.json"
# path prefix the site uses to reach the images (relative to pages/*.html)
WEB_PREFIX = "../images/papers/"
EXTS = ("png", "jpg", "jpeg", "webp", "gif", "svg")


def paper_ids():
    data = json.loads(PAPERS.read_text())
    ids = []
    for group in ("papers", "borderline"):
        for paper in data.get(group, []):
            pid = paper.get("id")
            if pid:
                ids.append(pid)
    return ids


def build():
    ids = paper_ids()
    files = [p.name for p in IMAGES_DIR.iterdir() if p.is_file()]
    matched = set()
    images = {}

    # longest ids first so a prefix id can't steal another id's files
    for pid in sorted(ids, key=len, reverse=True):
        pattern = re.compile(
            rf"^{re.escape(pid)}(?:-(\d+))?\.(?:{'|'.join(EXTS)})$",
            re.IGNORECASE,
        )
        hits = []
        for name in files:
            if name in matched:
                continue
            m = pattern.match(name)
            if m:
                # main image (no numeric suffix) sorts before -1, -2, ...
                order = -1 if m.group(1) is None else int(m.group(1))
                hits.append((order, name))
        if hits:
            hits.sort()
            matched.update(name for _, name in hits)
            # preserve paper order from papers.json for a stable diff
            images[pid] = [WEB_PREFIX + name for _, name in hits]

    # re-key in papers.json order for a deterministic, readable file
    ordered = {pid: images[pid] for pid in ids if pid in images}

    orphans = sorted(set(files) - matched)
    return ordered, orphans


def main():
    ordered, orphans = build()
    OUTPUT.write_text(json.dumps({"images": ordered}, indent=2) + "\n")
    print(f"paper-images.json: {len(ordered)} papers with images")
    if orphans:
        print(
            f"WARNING: {len(orphans)} image file(s) match no paper id: "
            + ", ".join(orphans),
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
