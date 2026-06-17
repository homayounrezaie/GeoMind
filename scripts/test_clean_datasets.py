import json
import re
import unittest
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "datasets.json"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HTTP = re.compile(r"^https?://", re.IGNORECASE)
REQUIRED = ("id", "name", "summary", "description", "task", "links")


def load_datasets():
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    return payload["datasets"] if isinstance(payload, dict) else payload


class CleanDatasetsTest(unittest.TestCase):
    def setUp(self):
        self.datasets = load_datasets()

    def test_file_is_nonempty_list(self):
        self.assertIsInstance(self.datasets, list)
        self.assertGreater(len(self.datasets), 0)

    def test_required_fields_present(self):
        for item in self.datasets:
            for field in REQUIRED:
                self.assertTrue(item.get(field), f"{item.get('id')!r} missing {field}")

    def test_ids_unique_and_slugged(self):
        ids = [item["id"] for item in self.datasets]
        self.assertEqual(len(ids), len(set(ids)), "duplicate ids")
        for an_id in ids:
            self.assertRegex(an_id, SLUG, f"{an_id!r} is not a kebab-case slug")

    def test_links_are_http_urls(self):
        for item in self.datasets:
            self.assertIsInstance(item["links"], dict)
            self.assertGreater(len(item["links"]), 0, f"{item['id']} has no links")
            for key, value in item["links"].items():
                self.assertRegex(str(value), HTTP, f"{item['id']}.links.{key} is not a URL")

    def test_versions_well_formed(self):
        for item in self.datasets:
            versions = item.get("versions")
            if versions is None:
                continue
            self.assertIsInstance(versions, list)
            for version in versions:
                self.assertTrue(version.get("name"), f"{item['id']} version missing name")
                if version.get("url"):
                    self.assertRegex(str(version["url"]), HTTP)

    def test_bigearthnet_exists_once_with_versions(self):
        be = [d for d in self.datasets if "bigearthnet" in d["id"]]
        self.assertEqual(len(be), 1, "BigEarthNet must appear exactly once")
        self.assertGreaterEqual(len(be[0].get("versions", [])), 2)


if __name__ == "__main__":
    unittest.main()
