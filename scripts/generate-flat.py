#!/usr/bin/env python3
"""
Generates KodeNIK.flat.json from hierarchical KodeNIK.json.
Flattens 3-tier hierarchy into an O(1) lookup dictionary keyed by 6-digit NIK prefix.
"""

import json
import os
import sys

def generate_flat():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_path = os.path.join(root_dir, "KodeNIK.json")
    target_path = os.path.join(root_dir, "KodeNIK.flat.json")

    with open(source_path, "r", encoding="utf-8") as f:
        source_data = json.load(f)

    flat_data = {
        "title": "KodeNIK.flat.json",
        "version": source_data.get("version", ""),
        "description": "Pre-indexed flat key-value dictionary mapping 6-digit NIK prefixes to administrative entities",
        "URL": source_data.get("URL", ""),
        "author": source_data.get("author", ""),
        "authorURL": source_data.get("authorURL", ""),
        "total_kecamatan": 0,
        "districts": {}
    }

    total_districts = 0
    for prov in source_data["data"]:
        p_code = prov["kode_provinsi"]
        p_name = prov["nama_provinsi"]

        for kab in prov["kabkota"]:
            k_code = kab["kode_kabkota"]
            k_name = kab["nama_kabkota"]

            for kec in kab["kecamatan"]:
                c_code = kec["kode_kecamatan"]
                c_name = kec["nama_kecamatan"]

                prefix = f"{p_code}{k_code}{c_code}"
                if prefix in flat_data["districts"]:
                    raise ValueError(f"Duplicate 6-digit NIK prefix encountered: {prefix}")

                flat_data["districts"][prefix] = {
                    "kode_provinsi": p_code,
                    "nama_provinsi": p_name,
                    "kode_kabkota": k_code,
                    "nama_kabkota": k_name,
                    "kode_kecamatan": c_code,
                    "nama_kecamatan": c_name
                }
                total_districts += 1

    flat_data["total_kecamatan"] = total_districts

    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(flat_data, f, indent=4, ensure_ascii=False)
        f.write("\n")

    print(f"Generated {target_path} with {total_districts} districts.")

if __name__ == "__main__":
    generate_flat()
