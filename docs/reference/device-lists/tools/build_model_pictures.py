#!/usr/bin/env python3
"""
build_model_pictures.py
Fetches one free front picture per iPhone and Samsung model from Wikimedia Commons.
Generates model-pictures.csv (brand, model, image_url, license, author, source_url).
"""

import csv
import json
import re
import time
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

USER_AGENT = "MobileERPDeviceLookup/1.0 (contact: info@malika-retail.uz; POS Reference Data Builder)"

def fetch_json(url):
    for attempt in range(4):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2.0 * (attempt + 1))
                continue
            return {}
        except Exception:
            time.sleep(1.0)
            continue
    return {}

def get_commons_metadata(file_title):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url|extmetadata&format=json"
    data = fetch_json(url)
    pages = list(data.get("query", {}).get("pages", {}).values())
    if not pages or "-1" in pages[0]:
        return None
    ii = pages[0].get("imageinfo", [{}])[0]
    meta = ii.get("extmetadata", {})
    lic = meta.get("LicenseShortName", {}).get("value", "")
    if not lic or not any(free in lic.lower() for free in ["cc", "public domain", "gpl", "mit", "pd"]):
        return None
    raw_artist = meta.get("Artist", {}).get("value", "Unknown")
    artist = BeautifulSoup(raw_artist, "html.parser").get_text(strip=True) if raw_artist else "Unknown"
    return {
        "image_url": ii.get("url", ""),
        "license": lic,
        "author": artist if artist else "Unknown",
        "source_url": ii.get("descriptionurl", "")
    }

def get_picture_for_model(brand, model):
    # Strategy 1: Wikipedia article lead image with pilicense=free
    search_queries = []
    if brand == "Apple":
        search_queries.append(model)
        # Simplify if variant e.g. iPhone 15 Pro Max -> iPhone 15 Pro
        m_base = re.sub(r"\s*(Max|Plus)", "", model)
        if m_base != model:
            search_queries.append(m_base)
    else:
        # Samsung
        clean = re.sub(r"\s*(5G|UW|Dual SIM|Olympic Games Edition)", "", model).strip()
        search_queries.append(f"Samsung {clean}")
        # Base S/Note/Z/A series
        m_s = re.search(r"Galaxy (S\d+|Note\s*\d+|Z\s*Fold\s*\d+|Z\s*Flip\s*\d+|A\d+)", clean)
        if m_s:
            search_queries.append(f"Samsung Galaxy {m_s.group(1)}")

    for sq in search_queries:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(sq)}&prop=pageimages&pilicense=free&piprop=original|name&format=json"
        data = fetch_json(url)
        pages = list(data.get("query", {}).get("pages", {}).values())
        if pages and "-1" not in pages[0]:
            pimg = pages[0].get("pageimage")
            if pimg:
                meta = get_commons_metadata("File:" + pimg)
                if meta and meta["image_url"]:
                    return {
                        "brand": brand,
                        "model": model,
                        "image_url": meta["image_url"],
                        "license": meta["license"],
                        "author": meta["author"],
                        "source_url": meta["source_url"]
                    }

    # Strategy 2: Search Wikimedia Commons for front photo
    term = f"{model} front" if brand == "Apple" else f"Samsung {model} front"
    c_search_url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(term)}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&format=json"
    s_data = fetch_json(c_search_url)
    pages = s_data.get("query", {}).get("pages", {})
    for pid, p in pages.items():
        title = p.get("title", "")
        # Filter out non-device images
        if any(skip in title.lower() for skip in ["locomotive", "train", "case", "box", "screen replacement", "camera"]):
            continue
        ii = p.get("imageinfo", [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if lic and any(free in lic.lower() for free in ["cc", "public domain", "gpl", "mit", "pd"]):
            raw_artist = meta.get("Artist", {}).get("value", "Unknown")
            artist = BeautifulSoup(raw_artist, "html.parser").get_text(strip=True) if raw_artist else "Unknown"
            return {
                "brand": brand,
                "model": model,
                "image_url": ii.get("url", ""),
                "license": lic,
                "author": artist if artist else "Unknown",
                "source_url": ii.get("descriptionurl", "")
            }

    return None

def main():
    with open("docs/reference/device-lists/iphone-box-codes.csv") as f:
        iphone_models = sorted(list(set(row["model"] for row in csv.DictReader(f))))

    with open("docs/reference/device-lists/samsung-model-codes.csv") as f:
        samsung_models = sorted(list(set(row["model"] for row in csv.DictReader(f))))

    rows = []
    print(f"Finding pictures for {len(iphone_models)} iPhone models...")
    for m in iphone_models:
        pic = get_picture_for_model("Apple", m)
        if pic:
            rows.append(pic)
        time.sleep(0.1)

    print(f"Finding pictures for {len(samsung_models)} Samsung models...")
    for m in samsung_models:
        pic = get_picture_for_model("Samsung", m)
        if pic:
            rows.append(pic)
        time.sleep(0.1)

    # Output CSV
    csv_path = "docs/reference/device-lists/model-pictures.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["brand", "model", "image_url", "license", "author", "source_url"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote model-pictures.csv with {len(rows)} rows.")
    apple_found = len([r for r in rows if r["brand"] == "Apple"])
    samsung_found = len([r for r in rows if r["brand"] == "Samsung"])
    print(f"  Apple models: {apple_found}/{len(iphone_models)}")
    print(f"  Samsung models: {samsung_found}/{len(samsung_models)}")

if __name__ == "__main__":
    main()
