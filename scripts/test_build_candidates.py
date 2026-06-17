import unittest

from build_candidates import build_benchmarks, build_datasets, normalize_name


class NormalizeNameTest(unittest.TestCase):
    def test_strips_case_punctuation_and_version_tokens(self):
        self.assertEqual(normalize_name("BigEarthNet"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet-S2"), "bigearthnet")
        self.assertEqual(normalize_name("bigearthnet_v2"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet S1"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet v1.0 (full)"), "bigearthnet")


class BuildDatasetsTest(unittest.TestCase):
    def test_collapses_variants_into_one_entry(self):
        records = [
            {"name": "BigEarthNet", "url": "https://a", "source": "X"},
            {"name": "BigEarthNet-S2", "url": "https://b", "source": "Y"},
            {"name": "bigearthnet_v2", "url": "https://c", "source": "X"},
            {"name": "EuroSAT", "url": "https://e", "source": "Z"},
        ]
        out = {d["id"]: d for d in build_datasets([records])}
        self.assertEqual(out["bigearthnet"]["raw_count"], 3)
        self.assertEqual(len(out["bigearthnet"]["candidate_urls"]), 3)
        self.assertTrue(out["eurosat"]["known"])  # eurosat is in KNOWN_DATASETS

    def test_merges_sources_across_inputs_for_unknown_dataset(self):
        records = [
            {"name": "FooSat", "url": "https://a", "source": "X", "description": "first"},
            {"name": "FooSat", "url": "https://b", "source": "Y", "description": "second"},
        ]
        out = {d["id"]: d for d in build_datasets([records])}
        self.assertEqual(out["foosat"]["sources"], ["X", "Y"])
        self.assertEqual(out["foosat"]["raw_count"], 2)
        self.assertEqual(out["foosat"]["description"], "first")  # first non-empty wins


class BuildBenchmarksTest(unittest.TestCase):
    def test_groups_by_dataset_task_metric(self):
        records = [
            {"name": "EuroSAT - Classification", "dataset": "EuroSAT", "task": "Classification", "metric": "Accuracy", "source": "P"},
            {"name": "EuroSAT - Classification", "dataset": "EuroSAT", "task": "Classification", "metric": "Accuracy", "source": "Q"},
            {"name": "EuroSAT - Classification (F1)", "dataset": "EuroSAT", "task": "Classification", "metric": "F1", "source": "P"},
        ]
        out = build_benchmarks([records])
        self.assertEqual(len(out), 2)  # two distinct metrics -> two benchmarks


if __name__ == "__main__":
    unittest.main()
