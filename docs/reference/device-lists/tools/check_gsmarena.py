#!/usr/bin/env python3
"""
Run validation checks on samsung-colors.csv and samsung-memory.csv:
1. Number of our 171 models with colors and with memory.
2. No duplicate model + color and no duplicate model + storage + ram.
3. No value containing '<', '>', '{', a line break or more than 40 characters.
4. For 15 random models, print our row next to the raw text it came from.
"""

import re
import csv
import random
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent

def main():
    model_codes_file = BASE_DIR / "samsung-model-codes.csv"
    raw_file = BASE_DIR / "samsung-gsmarena-raw.csv"
    colors_file = BASE_DIR / "samsung-colors.csv"
    memory_file = BASE_DIR / "samsung-memory.csv"

    # All reference models
    all_models = set()
    with open(model_codes_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            all_models.add(row["model"].strip())

    total_models = len(all_models)
    print(f"=== CHECK REPORT FOR GSMARENA SAMSUNG DATA ===")
    print(f"Total reference models: {total_models}")

    # Check 1 & 2: Colors file
    colors_rows = []
    color_models = set()
    dup_colors = []
    invalid_color_vals = []
    seen_color_keys = set()

    with open(colors_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            colors_rows.append(row)
            m = row["model"].strip()
            c = row["color"].strip()
            color_models.add(m)
            key = (m, c)
            if key in seen_color_keys:
                dup_colors.append(key)
            seen_color_keys.add(key)
            for k, v in row.items():
                if any(bad in v for bad in ["<", ">", "{", "\n", "\r"]) or len(v) > 40:
                    # Allow source_url to exceed 40 characters since URLs are naturally long
                    if k != "source_url":
                        invalid_color_vals.append((idx, k, v))

    # Check 1 & 2: Memory file
    memory_rows = []
    memory_models = set()
    dup_memory = []
    invalid_memory_vals = []
    seen_memory_keys = set()

    with open(memory_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            memory_rows.append(row)
            m = row["model"].strip()
            s = row["storage"].strip()
            r = row["ram"].strip()
            memory_models.add(m)
            key = (m, s, r)
            if key in seen_memory_keys:
                dup_memory.append(key)
            seen_memory_keys.add(key)
            for k, v in row.items():
                if any(bad in v for bad in ["<", ">", "{", "\n", "\r"]) or len(v) > 40:
                    if k != "source_url":
                        invalid_memory_vals.append((idx, k, v))

    print(f"\n1. MODEL COVERAGE:")
    print(f"   Models with colors: {len(color_models)} / {total_models} ({len(colors_rows)} total rows)")
    print(f"   Models with memory: {len(memory_models)} / {total_models} ({len(memory_rows)} total rows)")

    print(f"\n2. DUPLICATE KEY CHECKS:")
    print(f"   Duplicate (model + color): {len(dup_colors)}")
    if dup_colors:
        print(f"   Sample duplicate colors: {dup_colors[:5]}")
    print(f"   Duplicate (model + storage + ram): {len(dup_memory)}")
    if dup_memory:
        print(f"   Sample duplicate memory: {dup_memory[:5]}")

    print(f"\n3. INVALID VALUE CHECKS (<, >, {{, line break, > 40 chars in model/color/storage/ram):")
    print(f"   Invalid color values: {len(invalid_color_vals)}")
    if invalid_color_vals:
        print(f"   Sample invalid color values: {invalid_color_vals[:5]}")
    print(f"   Invalid memory values: {len(invalid_memory_vals)}")
    if invalid_memory_vals:
        print(f"   Sample invalid memory values: {invalid_memory_vals[:5]}")

    # Check 4: For 15 random models, print our row next to the raw text it came from
    raw_by_url = {}
    with open(raw_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_by_url[row["source_url"]] = row

    models_with_both = sorted(list(color_models.intersection(memory_models)))
    random.seed(42)
    sample_models = random.sample(models_with_both, min(15, len(models_with_both)))

    print(f"\n4. VERIFICATION OF 15 RANDOM MODELS (OUR ROWS VS RAW TEXT):")
    for i, m in enumerate(sample_models, 1):
        m_colors = [r for r in colors_rows if r["model"] == m]
        m_memory = [r for r in memory_rows if r["model"] == m]
        url = m_colors[0]["source_url"] if m_colors else (m_memory[0]["source_url"] if m_memory else "")
        raw = raw_by_url.get(url, {})

        print(f"\n[{i:02d}] MODEL: {m}")
        print(f"     Source URL: {url}")
        print(f"     RAW Colors  : {raw.get('colors', '')}")
        print(f"     PARSED Colors: {[r['color'] for r in m_colors]}")
        print(f"     RAW Internal: {raw.get('internal', '')}")
        print(f"     PARSED Memory: {[(r['storage'], r['ram']) for r in m_memory]}")

if __name__ == "__main__":
    main()

