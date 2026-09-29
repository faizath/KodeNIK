import json
import os
import re
import unittest

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "KodeNIK.json")

class TestKodeNIKIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assert os.path.exists(DATASET_PATH), "KodeNIK.json must exist"
        with open(DATASET_PATH, "rb") as f:
            raw = f.read()
            assert not raw.startswith(b"\xef\xbb\xbf"), "Must not contain UTF-8 BOM"
        cls.dataset = json.loads(raw.decode("utf-8"))

    def test_top_level_metadata(self):
        expected_keys = {"title", "version", "description", "URL", "author", "authorURL", "data"}
        self.assertEqual(set(self.dataset.keys()), expected_keys)
        self.assertEqual(self.dataset["title"], "KodeNIK.json")
        self.assertRegex(self.dataset["version"], r"^\d{4}\.\d{2}\.\d{2}$")
        self.assertRegex(self.dataset["URL"], r"^https?://")
        self.assertRegex(self.dataset["authorURL"], r"^https?://")
        self.assertIsInstance(self.dataset["data"], list)
        self.assertEqual(len(self.dataset["data"]), 38)

    def test_data_hierarchy_and_uniqueness(self):
        two_digit = re.compile(r"^\d{2}$")
        province_codes = set()
        province_names = set()
        global_district_prefixes = set()

        total_kabkota = 0
        total_kecamatan = 0

        for prov in self.dataset["data"]:
            p_code = prov["kode_provinsi"]
            p_name = prov["nama_provinsi"]
            self.assertRegex(p_code, two_digit, f"Invalid province code format: {p_code}")
            self.assertEqual(p_name, p_name.strip(), f"Untrimmed province name: {p_name}")

            self.assertNotIn(p_code, province_codes, f"Duplicate province code: {p_code}")
            self.assertNotIn(p_name, province_names, f"Duplicate province name: {p_name}")
            province_codes.add(p_code)
            province_names.add(p_name)

            self.assertIsInstance(prov["kabkota"], list)
            self.assertGreater(len(prov["kabkota"]), 0, f"kabkota empty in province {p_name}")

            kabkota_codes = set()
            kabkota_names = set()

            for kab in prov["kabkota"]:
                total_kabkota += 1
                k_code = kab["kode_kabkota"]
                k_name = kab["nama_kabkota"]
                self.assertRegex(k_code, two_digit, f"Invalid kabkota code: {k_code}")
                self.assertEqual(k_name, k_name.strip(), f"Untrimmed kabkota name: {k_name}")

                code_num = int(k_code)
                if k_name.startswith("Kab. "):
                    self.assertLess(code_num, 71, f"Kabupaten code must be < 71: {k_code} for {k_name}")
                elif k_name.startswith("Kota "):
                    self.assertGreaterEqual(code_num, 71, f"Kota code must be >= 71: {k_code} for {k_name}")
                else:
                    self.fail(f"Invalid kabkota name prefix: {k_name}")

                self.assertNotIn(k_code, kabkota_codes, f"Duplicate kabkota code: {k_code} in {p_name}")
                self.assertNotIn(k_name, kabkota_names, f"Duplicate kabkota name: {k_name} in {p_name}")
                kabkota_codes.add(k_code)
                kabkota_names.add(k_name)

                self.assertIsInstance(kab["kecamatan"], list)
                self.assertGreater(len(kab["kecamatan"]), 0, f"kecamatan empty in kab {k_name}")

                kecamatan_codes = set()
                kecamatan_names = set()

                for kec in kab["kecamatan"]:
                    total_kecamatan += 1
                    kc_code = kec["kode_kecamatan"]
                    kc_name = kec["nama_kecamatan"]
                    self.assertRegex(kc_code, two_digit, f"Invalid kecamatan code: {kc_code}")
                    self.assertEqual(kc_name, kc_name.strip(), f"Untrimmed kecamatan name: {kc_name}")

                    # Verify balanced parentheses in alternative names
                    if "(" in kc_name or ")" in kc_name:
                        matches = re.findall(r"\(([^)]+)\)", kc_name)
                        self.assertGreater(len(matches), 0, f"Unmatched parentheses in: {kc_name}")
                        for m in matches:
                            self.assertGreater(len(m.strip()), 0, f"Empty alias in: {kc_name}")

                    self.assertNotIn(kc_code, kecamatan_codes, f"Duplicate kec code: {kc_code} in {k_name}")
                    self.assertNotIn(kc_name, kecamatan_names, f"Duplicate kec name: {kc_name} in {k_name}")
                    kecamatan_codes.add(kc_code)
                    kecamatan_names.add(kc_name)

                    # Global 6-digit NIK prefix uniqueness
                    prefix = f"{p_code}{k_code}{kc_code}"
                    self.assertEqual(len(prefix), 6, f"Invalid prefix length: {prefix}")
                    self.assertNotIn(prefix, global_district_prefixes, f"Duplicate 6-digit prefix: {prefix}")
                    global_district_prefixes.add(prefix)

        self.assertEqual(len(province_codes), 38, "Must contain 38 unique province codes")
        self.assertEqual(total_kabkota, 514, "Must contain exactly 514 regencies and cities")
        self.assertEqual(total_kecamatan, 7277, "Must contain exactly 7,277 districts")
        self.assertEqual(len(global_district_prefixes), 7277, "Must have 7,277 unique district prefixes")

if __name__ == "__main__":
    unittest.main()
