#!/usr/bin/env python3
"""
Build samsung-colors.csv and samsung-memory.csv from samsung-gsmarena-raw.csv.
Rules:
- Match pages to models by model_code from samsung-model-codes.csv (ignoring trailing /DS).
- samsung-colors.csv: (model, color, source_url) split on commas.
- samsung-memory.csv: (model, storage, ram, source_url) parsed from Internal.
- No typed values or tables.
"""

import re
import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent

def clean_code(c: str) -> str:
    # Remove parenthesized notes, e.g. SM-A528B/DS (Global) -> SM-A528B/DS
    c = re.sub(r"\s*\(.*?\)", "", c).strip()
    # Ignore trailing /DS or /ds
    c = re.sub(r"/(?:DS|ds)$", "", c).strip()
    return c

def parse_memory_chunk(chunk: str):
    # Match pairs like "256GB 12GB RAM" or "1TB 12GB RAM" or "16GB 1GB RAM"
    chunk = chunk.strip()
    m = re.search(r"(\d+(?:\.\d+)?\s*(?:GB|TB|MB))\s+(\d+(?:\.\d+)?\s*(?:GB|MB))(?:\s*RAM)?", chunk, re.IGNORECASE)
    if m:
        storage = re.sub(r"\s+", "", m.group(1)).upper()
        ram = re.sub(r"\s+", "", m.group(2)).upper()
        return storage, ram
    return None, None

def main():
    model_codes_file = BASE_DIR / "samsung-model-codes.csv"
    raw_file = BASE_DIR / "samsung-gsmarena-raw.csv"

    if not raw_file.exists():
        print(f"Error: {raw_file} does not exist. Run scrape_gsmarena.py first.")
        return

    # 1. Read all models and model_codes
    code_to_models = defaultdict(set)
    all_models = set()
    with open(model_codes_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            m = row["model"].strip()
            c = row["model_code"].strip()
            if m and c:
                code_to_models[c].add(m)
                all_models.add(m)

    print(f"Total reference models: {len(all_models)}")
    print(f"Total distinct reference model codes: {len(code_to_models)}")

    # 2. Read raw GSMArena pages
    raw_pages = []
    with open(raw_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_pages.append(row)

    print(f"Loaded {len(raw_pages)} raw phone records.")

    # 3. Match pages to models
    model_to_pages = defaultdict(list)
    pages_matching_multiple = []

    for page in raw_pages:
        raw_models_text = page.get("models", "")
        # Split on commas
        page_codes = [clean_code(c) for c in raw_models_text.split(",") if clean_code(c)]
        matched_models = set()
        for c in page_codes:
            if c in code_to_models:
                matched_models.update(code_to_models[c])

        if len(matched_models) > 1:
            pages_matching_multiple.append({
                "gsmarena_name": page["gsmarena_name"],
                "source_url": page["source_url"],
                "matched_models": sorted(matched_models)
            })

        for m in matched_models:
            model_to_pages[m].append(page)

    unmatched_models = sorted(list(all_models - set(model_to_pages.keys())))

    print(f"\n--- MATCHING RESULTS ---")
    print(f"Models matched to at least one page: {len(model_to_pages)} / {len(all_models)}")
    print(f"Models matching NO page: {len(unmatched_models)}")
    if unmatched_models:
        print("Unmatched models:", unmatched_models)

    print(f"Pages matching multiple models: {len(pages_matching_multiple)}")
    for p in pages_matching_multiple[:10]:
        print(f"  {p['gsmarena_name']} -> {p['matched_models']}")

    # 4. Write samsung-colors.csv
    colors_path = BASE_DIR / "samsung-colors.csv"
    color_rows = []
    seen_colors = set()

    for m in sorted(all_models):
        pages = model_to_pages.get(m, [])
        for page in pages:
            raw_colors = page.get("colors", "")
            for col in raw_colors.split(","):
                col = col.strip()
                if not col:
                    continue
                key = (m, col)
                if key not in seen_colors:
                    seen_colors.add(key)
                    color_rows.append({
                        "model": m,
                        "color": col,
                        "source_url": page["source_url"]
                    })

    with open(colors_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "color", "source_url"])
        writer.writeheader()
        writer.writerows(color_rows)
    print(f"\nWrote {len(color_rows)} rows to {colors_path.name}")

    # 5. Write samsung-memory.csv
    memory_path = BASE_DIR / "samsung-memory.csv"
    memory_rows = []
    seen_memory = set()

    for m in sorted(all_models):
        pages = model_to_pages.get(m, [])
        for page in pages:
            raw_internal = page.get("internal", "")
            for chunk in raw_internal.split(","):
                storage, ram = parse_memory_chunk(chunk)
                if storage and ram:
                    key = (m, storage, ram)
                    if key not in seen_memory:
                        seen_memory.add(key)
                        memory_rows.append({
                            "model": m,
                            "storage": storage,
                            "ram": ram,
                            "source_url": page["source_url"]
                        })

    with open(memory_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "storage", "ram", "source_url"])
        writer.writeheader()
        writer.writerows(memory_rows)
    print(f"Wrote {len(memory_rows)} rows to {memory_path.name}")

if __name__ == "__main__":
    main()
