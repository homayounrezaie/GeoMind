import io
import os
import unittest
from unittest import mock

from PIL import Image

import src.workers.generate_thumbnail as worker


class FakeStore:
    def __init__(self, row):
        self.row = dict(row)
        self.updates = []

    def get(self, paper_id):
        if self.row["id"] != paper_id:
            raise KeyError(paper_id)
        return self.row

    def update_thumbnail(self, paper_id, *, thumbnail_url=None, thumbnail_status=None):
        if self.row["id"] != paper_id:
            raise KeyError(paper_id)
        if thumbnail_url is not None:
            self.row["thumbnail_url"] = thumbnail_url
        if thumbnail_status is not None:
            self.row["thumbnail_status"] = thumbnail_status
        self.updates.append((thumbnail_url, thumbnail_status))


class FakeStorage:
    def __init__(self, exists=False):
        self.exists_value = exists
        self.exists_calls = []
        self.uploads = []

    def key_for(self, paper_id):
        return f"thumbnails/{paper_id}.webp"

    def exists(self, key):
        self.exists_calls.append(key)
        return self.exists_value

    def public_url(self, key):
        return f"https://cdn.example.test/{key}"

    def upload(self, key, body):
        self.uploads.append((key, body))
        return self.public_url(key)


class FakeHttp:
    def __init__(self, responses):
        self.responses = responses
        self.calls = []

    def fetch(self, url, *, accept="*/*", arxiv=False):
        self.calls.append({"url": url, "accept": accept, "arxiv": arxiv})
        response = self.responses[url]
        if isinstance(response, BaseException):
            raise response
        return response


def image_bytes():
    image = Image.new("RGB", (1200, 800), (32, 96, 160))
    output = io.BytesIO()
    image.save(output, "PNG")
    return output.getvalue()


class GenerateThumbnailTests(unittest.TestCase):
    def test_arxiv_id_downloads_pdf_and_uploads_thumbnail(self):
        store = FakeStore({"id": "paper_1", "arxiv_id": "2401.12345", "title": "Paper"})
        storage = FakeStorage()
        http = FakeHttp({
            "https://arxiv.org/pdf/2401.12345.pdf": worker.HttpResponse(b"%PDF", "application/pdf", "https://arxiv.org/pdf/2401.12345.pdf"),
        })

        with mock.patch.dict(os.environ, {"ARXIV_MIN_INTERVAL_SECONDS": "0"}), mock.patch.object(
            worker,
            "render_pdf_first_page_webp",
            return_value=b"webp-bytes",
        ) as render_pdf:
            url = worker.generate_thumbnail("paper_1", store=store, storage=storage, http=http)

        self.assertEqual(url, "https://cdn.example.test/thumbnails/paper_1.webp")
        self.assertEqual(http.calls[0]["url"], "https://arxiv.org/pdf/2401.12345.pdf")
        self.assertTrue(http.calls[0]["arxiv"])
        render_pdf.assert_called_once_with(b"%PDF")
        self.assertEqual(storage.uploads[0], ("thumbnails/paper_1.webp", b"webp-bytes"))
        self.assertEqual(store.row["thumbnail_status"], "ready")
        self.assertEqual(store.row["thumbnail_url"], url)

    def test_external_url_uses_og_image(self):
        store = FakeStore({"id": "paper_2", "external_url": "https://example.test/post", "title": "Paper"})
        storage = FakeStorage()
        http = FakeHttp({
            "https://example.test/post": worker.HttpResponse(
                b'<html><meta property="og:image" content="/card.png"></html>',
                "text/html",
                "https://example.test/post",
            ),
            "https://example.test/card.png": worker.HttpResponse(
                image_bytes(),
                "image/png",
                "https://example.test/card.png",
            ),
        })

        url = worker.generate_thumbnail("paper_2", store=store, storage=storage, http=http)

        self.assertEqual(url, "https://cdn.example.test/thumbnails/paper_2.webp")
        self.assertEqual([call["url"] for call in http.calls], ["https://example.test/post", "https://example.test/card.png"])
        self.assertTrue(storage.uploads[0][1].startswith(b"RIFF"))
        self.assertEqual(store.row["thumbnail_status"], "ready")

    def test_external_url_without_social_image_uses_fallback_card(self):
        store = FakeStore({
            "id": "paper_3",
            "external_url": "https://example.test/no-image",
            "title": "A Remote Sensing Paper",
            "authors": "Ada Lovelace; Grace Hopper",
        })
        storage = FakeStorage()
        http = FakeHttp({
            "https://example.test/no-image": worker.HttpResponse(
                b"<html><title>No image</title></html>",
                "text/html",
                "https://example.test/no-image",
            ),
        })

        url = worker.generate_thumbnail("paper_3", store=store, storage=storage, http=http)

        self.assertEqual(url, "https://cdn.example.test/thumbnails/paper_3.webp")
        self.assertEqual(len(http.calls), 1)
        self.assertTrue(storage.uploads[0][1].startswith(b"RIFF"))
        self.assertEqual(store.row["thumbnail_status"], "ready")

    def test_idempotency_skips_when_object_exists(self):
        store = FakeStore({"id": "paper_4", "pdf_url": "https://example.test/paper.pdf", "title": "Paper"})
        storage = FakeStorage(exists=True)
        http = FakeHttp({})

        url = worker.generate_thumbnail("paper_4", store=store, storage=storage, http=http)

        self.assertEqual(url, "https://cdn.example.test/thumbnails/paper_4.webp")
        self.assertEqual(http.calls, [])
        self.assertEqual(storage.uploads, [])
        self.assertEqual(store.row["thumbnail_status"], "ready")
        self.assertEqual(store.row["thumbnail_url"], url)


if __name__ == "__main__":
    unittest.main()
