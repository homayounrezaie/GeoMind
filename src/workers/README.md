# Paper Thumbnail Worker

Generates one 600px-wide WebP thumbnail for a paper and uploads it to S3-compatible storage at:

```text
thumbnails/{paper_id}.webp
```

The public URL is written back to the paper row as `thumbnail_url`, with `thumbnail_status` set to `pending`, `ready`, or `failed`.

## Logic

`generate_thumbnail(paper_id)` runs in this order:

1. If `arxiv_id` exists, download `https://arxiv.org/pdf/{id}.pdf`, render page 1 with `pypdfium2` at `scale=2`, resize to 600px, and encode WebP quality 85.
2. Else if `pdf_url` exists, render page 1 the same way.
3. Else fetch the external page and use `og:image` or `twitter:image`.
4. If those fail, generate a deterministic fallback card from the paper title and first author.

The worker is idempotent. If `thumbnails/{paper_id}.webp` already exists, it skips generation and only updates the row.

## Environment

Required:

```bash
export S3_BUCKET=geomind-assets
export S3_ACCESS_KEY_ID=...
export S3_SECRET_ACCESS_KEY=...
```

Recommended for R2/MinIO/S3-compatible storage:

```bash
export S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
export S3_PUBLIC_BASE_URL=https://cdn.example.com
export S3_REGION=auto
```

Optional:

```bash
export THUMBNAIL_CSV_PATH=data/papers.csv
export S3_THUMBNAIL_PREFIX=thumbnails
export THUMBNAIL_USER_AGENT="MyApp/1.0 (contact@email)"
export ARXIV_MIN_INTERVAL_SECONDS=1
export CELERY_BROKER_URL=redis://localhost:6379/0
export CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r src/workers/requirements.txt
```

## Run One Job

```bash
python -m src.workers.generate_thumbnail paper_2001_00425
```

## Run As Celery Worker

```bash
celery -A src.workers.generate_thumbnail:celery_app worker -Q thumbnails --loglevel=info
```

Queue jobs with:

```python
from src.workers.generate_thumbnail import generate_thumbnail_task

generate_thumbnail_task.delay("paper_2001_00425")
```

For strict arXiv politeness across multiple processes, run a single thumbnail worker process or route arXiv-heavy jobs through one queue. The function enforces a process-local maximum of one arXiv request per second.
