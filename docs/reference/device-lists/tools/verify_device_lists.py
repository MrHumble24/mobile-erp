#!/usr/bin/env python3
"""
Verify device reference lists:
1. Uniqueness of primary keys (box_code, (model, color), model).
2. Integrity of required columns and non-empty model names.
3. Randomly samples 20 rows per file for second-source cross-verification.
"""

import csv
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

FILES_CONFIG = [
    ("ipad-box-codes.csv", ["model", "a_numbers", "identifier", "color", "storage", "box_code", "unit_type"], "box_code"),
    ("mac-box-codes.csv", ["model", "a_numbers", "identifier", "color", "storage", "ram", "box_code", "unit_type"], "box_code"),
    ("watch-box-codes.csv", ["model", "a_numbers", "identifier", "color", "storage", "box_code", "unit_type"], "box_code"),
    ("airpods-box-codes.csv", ["model", "a_numbers", "identifier", "color", "storage", "box_code", "unit_type"], "box_code"),
    ("samsung-colors.csv", ["model", "color", "source_url"], ("model", "color")),
    ("samsung-ram-storage.csv", ["series", "model", "year", "ram_gb", "storage_gb", "ram+storage_pairs", "source_records"], "model"),
    ("model-pictures.csv", ["brand", "model", "image_url", "license", "author", "source_url"], ("brand", "model")),
]

def check_integrity():
    print("=== INTEGRITY & UNIQUE KEY CHECKS ===")
    all_ok = True
    for fname, cols, key in FILES_CONFIG:
        path = BASE_DIR / fname
        if not path.exists():
            print(f"[FAIL] {fname} missing")
            all_ok = False
            continue
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            if reader.fieldnames != cols:
                print(f"[FAIL] {fname} header mismatch: {reader.fieldnames} != {cols}")
                all_ok = False
            seen = set()
            dups = 0
            empty_models = 0
            total = 0
            for row in reader:
                total += 1
                if not row.get("model", "").strip():
                    empty_models += 1
                k = tuple(row[x] for x in key) if isinstance(key, tuple) else row[key]
                if k in seen:
                    dups += 1
                seen.add(k)
            status = "PASS" if (dups == 0 and empty_models == 0) else "FAIL"
            if status == "FAIL":
                all_ok = False
            print(f"[{status}] {fname:25} Total: {total:5} | Duplicates: {dups} | Empty Models: {empty_models}")
    return all_ok

def sample_rows(seed=42):
    print("\n=== 20 RANDOM SPOT CHECKS PER FILE ===")
    random.seed(seed)
    samples = {}
    for fname, _, _ in FILES_CONFIG:
        path = BASE_DIR / fname
        with open(path, "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        k = min(20, len(rows))
        selected = random.sample(rows, k)
        samples[fname] = selected
        print(f"\n--- {fname} (Sample {k}/{len(rows)}) ---")
        for i, row in enumerate(selected, 1):
            if "box_code" in row:
                ram_part = f" | RAM: {row['ram']}" if "ram" in row else ""
                print(f"{i:2}. Code: {row['box_code']:6} | Model: {row['model']:32} | Color: {row.get('color',''):25} | Storage: {row.get('storage',''):6}{ram_part}")
            elif "ram_gb" in row:
                print(f"{i:2}. Model: {row['model']:25} | RAM: {row['ram_gb']:15} | Storage: {row['storage_gb']}")
            elif "license" in row:
                print(f"{i:2}. [{row['brand']}] {row['model']:25} | License: {row['license']:15} | Author: {row['author']}")
            else:
                print(f"{i:2}. Model: {row['model']:25} | Color: {row['color']}")
    return samples

if __name__ == "__main__":
    check_integrity()
    sample_rows()
