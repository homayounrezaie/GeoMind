# Candidate → datasets.json Promotion Plan

Goal: complete every dataset candidate to the clean schema (researching a real
link for any that lack one) and add it to `data/datasets.json`. Autonomous — no
per-batch approval. Non-geospatial junk is skipped (this is a geospatial index).

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress

## Scope
- **4,413** dataset candidates to promote (14 already in `datasets.json`).
- **871 high-signal** first (authoritative source / multi-source / known), then the long tail.
- Benchmarks (type=benchmark) are NOT promoted to `datasets.json` (separate concern).
- Agents skip clearly non-geospatial items (robotics / generic NLP / audio / random uploads).

## Quality bar (core + best-effort)
- **Required**: `id` (kebab-case, unique), `name`, `summary` (1 sentence), `description` (paragraph), `task`, `links` (≥1 real http URL).
- **Best-effort** (only if confidently known, never fabricated): `modality`, `size`, `numSamples`, `license`, `year`, `sources`, `versions[]`.
- **Links mandatory**: if a candidate has no/weak link, the agent researches (web) the homepage / paper / GitHub / download page. No link found after real effort → skip.

## Pipeline (per wave)
1. Agents read `data/_promote/selection.json`, process an index range, write kept entries to `data/_promote/drafts-<a>-<b>.json`.
2. `python3 scripts/promote_datasets.py merge 'data/_promote/drafts-*.json'` — strips non-schema fields, dedups (vs existing + within wave), validates against the clean schema, appends to `datasets.json`.
3. Re-run schema validation; commit the wave.
4. After all waves: bump `?v=` cache token on `pages/datasets.html` + `index.html`; confirm before pushing to `main`.

## Tooling
- `scripts/promote_datasets.py` — `select` / `validate <file>` / `merge <glob...>`.
- `data/_promote/` — gitignored staging (selection + drafts).

## Progress
- [x] Build tooling + selection (`selection.json`: 4,413; high-signal 871)
- [x] Write this plan
- [~] High-signal waves (871) — promote in chunks
- [ ] Long-tail waves (≈3,542, geospatial-filtered)
- [ ] Final: cache-bust + commit + push

### Wave log
- **Wave 1** — high-signal [0,120): 105 merged, 15 skipped (non-geo / `awesome-*` aggregators / code repos). `datasets.json` 12 → **117**.
