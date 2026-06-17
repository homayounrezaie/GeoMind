import unittest

from build_clean_datasets import group_datasets, normalize_name


class NormalizeNameTest(unittest.TestCase):
    def test_strips_case_punctuation_and_version_tokens(self):
        self.assertEqual(normalize_name("BigEarthNet"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet-S2"), "bigearthnet")
        self.assertEqual(normalize_name("bigearthnet_v2"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet S1"), "bigearthnet")
        self.assertEqual(normalize_name("BigEarthNet v1.0 (full)"), "bigearthnet")


class GroupDatasetsTest(unittest.TestCase):
    def test_collapses_bigearthnet_variants_to_one_group(self):
        raw = [
            {"dataset": "BigEarthNet", "sourceUrl": "https://a"},
            {"dataset": "BigEarthNet-S2", "sourceUrl": "https://b"},
            {"dataset": "bigearthnet_v2", "sourceUrl": "https://c"},
            {"dataset": "BigEarthNet S1", "sourceUrl": "https://d"},
            {"dataset": "EuroSAT", "sourceUrl": "https://e"},
        ]
        groups = group_datasets(raw)
        self.assertIn("bigearthnet", groups)
        self.assertEqual(len(groups["bigearthnet"]), 4)
        self.assertIn("eurosat", groups)
        self.assertEqual(len(groups["eurosat"]), 1)


if __name__ == "__main__":
    unittest.main()
