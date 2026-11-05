#!/usr/bin/env python3
"""
Scrape Samsung phone pages from GSMArena.
Strict rules:
- >= 12.0 seconds between requests.
- Cache every downloaded page in tools/.cache/gsmarena/.
- If HTTP 429, wait 15 minutes, then retry once.
- No typed values or tables: extract only from downloaded HTML.
"""

import os
import re
import csv
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BASE_DIR / "tools" / ".cache" / "gsmarena"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

LAST_REQUEST_TIME = 0.0
BLOCKED_429_COUNT = 0
DOWNLOADED_PAGES_COUNT = 0

def fetch_url(url: str) -> str:
    global LAST_REQUEST_TIME, BLOCKED_429_COUNT, DOWNLOADED_PAGES_COUNT

    # Sanitize URL to filename
    fname = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", url.split("/")[-1])
    if not fname.endswith(".html"):
        fname += ".html"
    cache_path = CACHE_DIR / fname

    if cache_path.exists():
        with open(cache_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    # Rate limiting: at most one request every 12 seconds
    elapsed = time.time() - LAST_REQUEST_TIME
    if elapsed < 12.0:
        time.sleep(12.0 - elapsed)

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )

    try:
        LAST_REQUEST_TIME = time.time()
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            with open(cache_path, "w", encoding="utf-8") as f:
                f.write(html)
            DOWNLOADED_PAGES_COUNT += 1
            print(f"Downloaded ({DOWNLOADED_PAGES_COUNT}): {url}")
            return html
    except urllib.error.HTTPError as e:
        if e.code == 429:
            BLOCKED_429_COUNT += 1
            print(f"HTTP 429 encountered on {url}. Stopping for 15 minutes...")
            time.sleep(15 * 60)
            # Retry once after 15 minutes
            LAST_REQUEST_TIME = time.time()
            with urllib.request.urlopen(req, timeout=30) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                with open(cache_path, "w", encoding="utf-8") as f:
                    f.write(html)
                DOWNLOADED_PAGES_COUNT += 1
                print(f"Downloaded after 429 wait ({DOWNLOADED_PAGES_COUNT}): {url}")
                return html
        raise

def get_brand_page_num(url: str) -> int:
    m = re.search(r"-p(\d+)\.php", url)
    return int(m.group(1)) if m else 1

def parse_brand_page(html: str):
    soup = BeautifulSoup(html, "html.parser")
    makers = soup.find("div", class_="makers")
    if not makers:
        return [], []

    phones = []
    for li in makers.find_all("li"):
        a = li.find("a")
        if not a or not a.get("href"):
            continue
        href = a["href"]
        full_url = href if href.startswith("http") else f"https://www.gsmarena.com/{href}"
        name = a.find("strong").get_text(strip=True) if a.find("strong") else a.get_text(strip=True)
        img = a.find("img")
        title = img.get("title", "") if img else ""
        phones.append({"name": name, "url": full_url, "title": title})

    next_pages = []
    nav = soup.find("div", class_="nav-pages")
    if nav:
        for a in nav.find_all("a"):
            href = a.get("href")
            if href:
                full_url = href if href.startswith("http") else f"https://www.gsmarena.com/{href}"
                next_pages.append(full_url)

    return phones, next_pages

def is_target_phone(name: str, title: str) -> bool:
    lower_name = name.lower()
    if any(x in lower_name for x in ["tab", "watch", "book", "buds", "fit", "ring", "camera"]):
        return False

    # Keep phones named Galaxy S, Note, A, Z (or Fold) from 2018 on
    m_name = re.search(r"Galaxy\s+(?:S|Note|A|Z|Fold)", name, re.IGNORECASE)
    if not m_name:
        return False
    # Check year from title if present
    years = re.findall(r"\b20(?:1[8-9]|2[0-9])\b", title + " " + name)
    older_years = re.findall(r"\b20(?:0[0-9]|1[0-7])\b", title + " " + name)
    if older_years and not years:
        return False
    return True

def extract_phone_specs(html: str, url: str):
    soup = BeautifulSoup(html, "html.parser")
    name_el = soup.find("h1", attrs={"data-spec": "modelname"})
    gsmarena_name = name_el.get_text(strip=True) if name_el else ""

    def get_spec(data_spec, fallback_label):
        el = soup.find("td", attrs={"data-spec": data_spec})
        if el:
            return el.get_text(strip=True)
        for tr in soup.find_all("tr"):
            ttl = tr.find("td", class_="ttl")
            if ttl and fallback_label.lower() in ttl.get_text().lower():
                nfo = tr.find("td", class_="nfo")
                if nfo:
                    return nfo.get_text(strip=True)
        return ""

    models = get_spec("models", "Models")
    colors = get_spec("colors", "Colors")
    internal = get_spec("internalmemory", "Internal")

    # Check launch year to filter strictly >= 2018
    year_el = soup.find("span", attrs={"data-spec": "year"})
    released_el = soup.find("td", attrs={"data-spec": "released-hl"})
    year_text = (year_el.get_text() if year_el else "") + " " + (released_el.get_text() if released_el else "")
    years = [int(y) for y in re.findall(r"\b(20\d\d)\b", year_text)]
    if years and max(years) < 2018:
        return None

    return {
        "gsmarena_name": gsmarena_name,
        "source_url": url,
        "models": models,
        "colors": colors,
        "internal": internal,
    }

def main():
    brand_url = "https://www.gsmarena.com/samsung-phones-9.php"
    visited_pages = set()
    to_visit_pages = [brand_url]
    target_phones = []

    print("Step 1: Walking brand pages...")
    while to_visit_pages:
        to_visit_pages.sort(key=get_brand_page_num)
        current_page = to_visit_pages.pop(0)
        if current_page in visited_pages:
            continue
        visited_pages.add(current_page)
        p_num = get_brand_page_num(current_page)
        print(f"Reading brand page {p_num}: {current_page}")
        try:
            html = fetch_url(current_page)
        except Exception as e:
            print(f"Error fetching {current_page}: {e}")
            break

        phones, next_pages = parse_brand_page(html)
        page_has_target = False
        target_count_before = len(target_phones)
        for p in phones:
            if is_target_phone(p["name"], p["title"]):
                page_has_target = True
                if not any(x["url"] == p["url"] for x in target_phones):
                    target_phones.append(p)

        new_targets = len(target_phones) - target_count_before
        print(f"  Brand page {p_num} added {new_targets} target phones (total: {len(target_phones)})")

        # Stop crawling brand pages if we are deep into pre-2018 devices
        for np in next_pages:
            if np not in visited_pages and np not in to_visit_pages:
                if page_has_target or p_num < 8:
                    to_visit_pages.append(np)

    print(f"Found {len(target_phones)} target phone pages from 2018 on.")

    raw_rows = []
    raw_path = BASE_DIR / "samsung-gsmarena-raw.csv"

    # Always ensure raw CSV exists with header
    with open(raw_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=["gsmarena_name", "source_url", "models", "colors", "internal"]
        )
        writer.writeheader()

    print("Step 2: Downloading phone pages and extracting specs...")
    for idx, p in enumerate(target_phones, 1):
        try:
            p_html = fetch_url(p["url"])
            specs = extract_phone_specs(p_html, p["url"])
            if specs:
                raw_rows.append(specs)
            if idx % 10 == 0 or idx == len(target_phones):
                with open(raw_path, "w", encoding="utf-8", newline="") as f:
                    writer = csv.DictWriter(
                        f, fieldnames=["gsmarena_name", "source_url", "models", "colors", "internal"]
                    )
                    writer.writeheader()
                    writer.writerows(raw_rows)
        except Exception as e:
            print(f"Error on {p['url']}: {e}")

    print(f"Saved {len(raw_rows)} rows to {raw_path.name}")
    print(f"Stats: Pages downloaded = {DOWNLOADED_PAGES_COUNT}, 429 blocked = {BLOCKED_429_COUNT}")

if __name__ == "__main__":
    main()
