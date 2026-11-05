#!/usr/bin/env python3
"""
fix_samsung_ram_storage.py
Fixes samsung-ram-storage.csv:
1. Adds missing models with verified data from Wikipedia, Samsung spec pages, and TechAPI.
2. Corrects RAM, storage, and ram+storage_pairs for S, Note, and Z series based on official specs.
3. Logs every value changed.
"""

import csv
import sys

def main():
    path = "docs/reference/device-lists/samsung-ram-storage.csv"
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Official specs corrections for S, Note, Z series
    # (checked against Samsung official spec pages & Wikipedia)
    corrections = {
        "Galaxy S10+": {
            "ram+storage_pairs": "8+128 8+512 12+1024",  # 8+1024 never existed (1TB is 12GB Ceramic)
        },
        "Galaxy S20+": {
            "ram+storage_pairs": "8+128 8+512 12+128 12+512",  # 4G is 8GB (128/512), 5G is 12GB (128/512)
        },
        "Galaxy S22 Ultra": {
            "storage_gb": "128 256 512 1024",
            "ram+storage_pairs": "8+128 12+256 12+512 12+1024",  # 12+128 did not exist; added missing 12+1024
        },
        "Galaxy S23 Ultra": {
            "storage_gb": "256 512 1024",  # S23 Ultra has no 128GB
            "ram_gb": "8 12",
            "ram+storage_pairs": "8+256 12+256 12+512 12+1024",  # 12+128 did not exist; added missing 12+1024
        },
        "Galaxy S24+": {
            "ram_gb": "12",  # S24+ has 12GB RAM across all variants (no 8GB)
            "ram+storage_pairs": "12+256 12+512",
        },
        "Galaxy S24 Ultra": {
            "storage_gb": "256 512 1024",  # S24 Ultra has no 128GB
            "ram+storage_pairs": "12+256 12+512 12+1024",  # 12+128 did not exist; added missing 12+1024
        },
        "Galaxy Note20 Ultra": {
            "ram+storage_pairs": "8+256 8+512 12+128 12+256 12+512",  # Added missing 512GB pairs
        },
        "Galaxy Z Fold4": {
            "ram+storage_pairs": "12+256 12+512 12+1024",  # Added missing 12+1024 (1TB existed at launch)
        },
        "Galaxy Z Fold5": {
            "ram+storage_pairs": "12+256 12+512 12+1024",  # Added missing 12+1024 (1TB existed at launch)
        },
        "Galaxy Z Flip6": {
            "storage_gb": "256 512",  # Z Flip6 has no 128GB tier
        },
        "Galaxy S25 Ultra": {
            "ram+storage_pairs": "12+256 12+512 16+1024",  # 1TB is 16GB RAM
        },
        "Galaxy S26": {
            "ram+storage_pairs": "12+256 12+512",
        },
        "Galaxy S26+": {
            "ram+storage_pairs": "12+256 12+512",
        },
    }

    changes_logged = []
    by_model = {r["model"]: r for r in rows}

    for model, corr in corrections.items():
        if model in by_model:
            row = by_model[model]
            for col, new_val in corr.items():
                old_val = row.get(col, "")
                if old_val != new_val:
                    changes_logged.append(f"{model} ({col}): '{old_val}' -> '{new_val}'")
                    row[col] = new_val

    # 11 models listed in README as missing:
    # A3 Core, A07s, A08, A9s, A18, A22s 5G, A23 5G UW, A27 5G, A53 5G UW, S26 FE, Z Flip8
    # Add the ones with downloaded verified data:
    new_models = [
        {
            "series": "A",
            "model": "Galaxy A3 Core",
            "year": "2020",
            "ram_gb": "1",
            "storage_gb": "16 32",
            "ram+storage_pairs": "1+16 1+32",
            "source_records": "Wikipedia (Samsung Galaxy A01 Core/A3 Core)"
        },
        {
            "series": "A",
            "model": "Galaxy A9s",
            "year": "2018",
            "ram_gb": "6 8",
            "storage_gb": "128",
            "ram+storage_pairs": "6+128 8+128",
            "source_records": "Wikipedia (Samsung Galaxy A9 (2018)/A9s)"
        },
        {
            "series": "A",
            "model": "Galaxy A22s 5G",
            "year": "2021",
            "ram_gb": "4",
            "storage_gb": "64 128",
            "ram+storage_pairs": "4+64 4+128",
            "source_records": "TechAPI SM-A226B / Samsung Russia"
        },
        {
            "series": "A",
            "model": "Galaxy A23 5G UW",
            "year": "2022",
            "ram_gb": "4",
            "storage_gb": "64",
            "ram+storage_pairs": "4+64",
            "source_records": "Wikipedia (Samsung Galaxy A23) / Verizon SM-A236V"
        },
        {
            "series": "A",
            "model": "Galaxy A53 5G UW",
            "year": "2022",
            "ram_gb": "6",
            "storage_gb": "128",
            "ram+storage_pairs": "6+128",
            "source_records": "Wikipedia (Samsung Galaxy A53 5G) / Verizon SM-A536V"
        },
        {
            "series": "A",
            "model": "Galaxy A08",
            "year": "2026",
            "ram_gb": "4",
            "storage_gb": "64 128",
            "ram+storage_pairs": "4+64 4+128",
            "source_records": "TechAPI device_catalog samsung-galaxy-a08.json"
        },
        {
            "series": "A",
            "model": "Galaxy A18",
            "year": "2026",
            "ram_gb": "4",
            "storage_gb": "64 128",
            "ram+storage_pairs": "4+64 4+128",
            "source_records": "TechAPI device_catalog samsung-galaxy-a18.json"
        },
        {
            "series": "A",
            "model": "Galaxy A27 5G",
            "year": "2026",
            "ram_gb": "6",
            "storage_gb": "128 256",
            "ram+storage_pairs": "6+128 6+256",
            "source_records": "TechAPI device_catalog samsung-galaxy-a27-5g.json"
        },
        {
            "series": "Z",
            "model": "Galaxy Z Flip8",
            "year": "2026",
            "ram_gb": "12",
            "storage_gb": "256 512",
            "ram+storage_pairs": "12+256 12+512",
            "source_records": "TechAPI device_catalog samsung-galaxy-z-flip8.json"
        }
    ]

    for nm in new_models:
        if nm["model"] not in by_model:
            rows.append(nm)
            by_model[nm["model"]] = nm
            changes_logged.append(f"Added missing model: {nm['model']} (RAM: {nm['ram_gb']}GB, Storage: {nm['storage_gb']}GB)")

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    with open("docs/reference/device-lists/tools/samsung_ram_storage_changes.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(changes_logged) + "\n")

    print(f"Updated samsung-ram-storage.csv: total rows = {len(rows)}")
    print(f"Total changes logged: {len(changes_logged)}")
    for c in changes_logged:
        print(" ", c)

if __name__ == "__main__":
    main()
