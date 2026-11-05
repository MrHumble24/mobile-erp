#!/usr/bin/env python3
"""
build_samsung_colors.py
Fetches official marketing color names for Samsung models in samsung-model-codes.csv
using Wikipedia and official Samsung sources. Generates samsung-colors.csv (model, color, source_url).
"""

import csv
import json
import re
import time
import urllib.parse
import urllib.request

USER_AGENT = "MobileERPDeviceLookup/1.0 (contact: info@malika-retail.uz; POS Reference Data Builder)"

def fetch_json(url):
    for attempt in range(5):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2.5 * (attempt + 1))
                continue
            return {}
        except Exception:
            time.sleep(1.5)
            continue
    return {}

def get_page_wikitext(title):
    url = f"https://en.wikipedia.org/w/api.php?action=parse&page={urllib.parse.quote(title)}&prop=wikitext&format=json"
    data = fetch_json(url)
    return data.get("parse", {}).get("wikitext", {}).get("*", "")

def clean_color_name(c):
    c = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", c)
    c = re.sub(r"<ref[^>]*>.*?</ref>", "", c)
    c = re.sub(r"<[^>]+>", "", c)
    c = c.replace("&nbsp;", " ").replace("&#160;", " ")
    c = re.sub(r"\(.*?\)", "", c)
    return c.strip(" '\".,;:*")

def parse_colors_from_wikitext(wt, model_name):
    colors = set()
    m = re.search(r"\|\s*colors\s*=\s*([^\n|]+(?:\n\*[^\n|]+)*)", wt)
    if m:
        raw_colors = m.group(1)
        sub_sections = re.split(r"'''([^':]+)[:']{1,3}", raw_colors)
        clean_model = model_name.replace("Galaxy ", "").replace(" 5G", "").replace(" UW", "").lower()
        matched = None
        if len(sub_sections) > 1:
            for idx in range(1, len(sub_sections), 2):
                if clean_model in sub_sections[idx].lower() or any(t in sub_sections[idx].lower() for t in clean_model.split()):
                    matched = sub_sections[idx + 1]
                    break
        for part in re.split(r"[,/<\n\*\•]", matched if matched else raw_colors):
            c = clean_color_name(part)
            if c and 2 < len(c) < 35 and not any(w in c.lower() for w in ["color", "standard", "exclusive", "edition", "model"]):
                colors.add(c)

    icons = re.findall(r"\{\{Color icon\|[^}]*\}\}\s*([A-Za-z0-9\s]+)", wt)
    for ic in icons:
        c = clean_color_name(ic)
        if c and 2 < len(c) < 35 and not any(w in c.lower() for w in ["color", "standard", "exclusive", "edition"]):
            if "Ultra" in model_name:
                if "Titanium" in ic or not any("titanium" in x for x in icons): colors.add(c)
            elif "Titanium" not in ic:
                colors.add(c)
    return sorted(list(colors))

_NOTE_URL = "https://news.samsung.com/global/introducing-galaxy-note10-designed-to-bring-passions-to-life-with-next-level-power"
_LITE_URL = "https://news.samsung.com/global/samsung-brings-galaxy-innovations-to-more-users-with-new-galaxy-s10-lite-and-galaxy-note10-lite"
_FE_URL = "https://news.samsung.com/global/samsung-announces-the-galaxy-s20-fe-a-flagship-with-fan-favorite-features-at-an-accessible-price-point"
_FOLD_URL = "https://news.samsung.com/global/galaxy-fold-available-for-pre-order-in-the-us-starting-april-15"

OFFICIAL_SOURCES = {
    "Galaxy Note10": (["Aura Glow", "Aura White", "Aura Black", "Aura Red", "Aura Pink", "Aura Blue"], _NOTE_URL),
    "Galaxy Note10 5G": (["Aura Glow", "Aura White", "Aura Black", "Aura Red", "Aura Pink", "Aura Blue"], _NOTE_URL),
    "Galaxy Note10+": (["Aura Glow", "Aura White", "Aura Black", "Aura Blue"], _NOTE_URL),
    "Galaxy Note10+ 5G": (["Aura Glow", "Aura White", "Aura Black", "Aura Blue"], _NOTE_URL),
    "Galaxy Note10 Lite": (["Aura Glow", "Aura Black", "Aura Red"], _LITE_URL),
    "Galaxy S10 Lite": (["Prism White", "Prism Black", "Prism Blue"], _LITE_URL),
    "Galaxy S20 FE": (["Cloud Navy", "Cloud Lavender", "Cloud Mint", "Cloud Red", "Cloud Orange", "Cloud White"], _FE_URL),
    "Galaxy S20 FE 5G": (["Cloud Navy", "Cloud Lavender", "Cloud Mint", "Cloud Red", "Cloud Orange", "Cloud White"], _FE_URL),
    "Galaxy Fold": (["Space Silver", "Cosmos Black", "Martian Green", "Astro Blue"], _FOLD_URL),
    "Galaxy Fold 5G": (["Space Silver", "Cosmos Black"], _FOLD_URL),
    "Galaxy S21 FE 5G": (["Olive", "Lavender", "White", "Graphite"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_S21_FE"),
    "Galaxy S23 FE": (["Mint", "Cream", "Graphite", "Purple", "Indigo", "Tangerine"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_S23_FE"),
    "Galaxy S24 FE": (["Blue", "Graphite", "Gray", "Mint", "Yellow"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_S24_FE"),
    "Galaxy A6": (["Black", "Gold", "Blue", "Lavender"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A6_/_A6%2B"),
    "Galaxy A6+": (["Black", "Gold", "Blue", "Lavender"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A6_/_A6%2B"),
    "Galaxy A7": (["Black", "Blue", "Gold", "Pink"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A7_(2018)"),
    "Galaxy A7 (2018)": (["Black", "Blue", "Gold", "Pink"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A7_(2018)"),
    "Galaxy A8(2018)": (["Black", "Orchid Grey", "Gold", "Blue"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8_(2018)"),
    "Galaxy A8+(2018)": (["Black", "Orchid Grey", "Gold", "Blue"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8_(2018)"),
    "Galaxy A9 (2018)": (["Caviar Black", "Lemonade Blue", "Bubblegum Pink"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A9_(2018)"),
    "Galaxy A9 2018": (["Caviar Black", "Lemonade Blue", "Bubblegum Pink"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A9_(2018)"),
    "Galaxy A9s": (["Caviar Black", "Lemonade Blue", "Bubblegum Pink"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A9_(2018)"),
    "Galaxy A10": (["Blue", "Black", "Red", "Gold"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A10"),
    "Galaxy A10e": (["Black", "White"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A10"),
    "Galaxy A10s": (["Blue", "Green", "Red", "Black"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A10s"),
    "Galaxy A20s": (["Black", "Blue", "Red", "Green"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A20s"),
    "Galaxy A20e": (["Black", "White", "Blue", "Coral"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A20"),
    "Galaxy A30s": (["Prism Crush Black", "Prism Crush White", "Prism Crush Green", "Prism Crush Violet"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A30s"),
    "Galaxy A40s": (["Black", "Gold", "Blue"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_M20"),
    "Galaxy A50s": (["Prism Crush Black", "Prism Crush White", "Prism Crush Green", "Prism Crush Violet"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A50"),
    "Galaxy A70s": (["Prism Crush Red", "Prism Crush White", "Prism Crush Black"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A70"),
    "Galaxy A52s 5G": (["Awesome Black", "Awesome White", "Awesome Violet", "Awesome Mint"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A52"),
    "Galaxy A03s": (["Black", "Blue", "White"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A03"),
    "Galaxy A04s": (["Black", "Green", "White", "Copper"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A04"),
    "Galaxy A04e": (["Black", "Light Blue", "Copper"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A04"),
    "Galaxy A05s": (["Black", "Silver", "Light Green"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A05"),
    "Galaxy A3 Core": (["Black", "Blue", "Red"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A01"),
    "Galaxy A2 Core": (["Black", "Blue", "Red", "Dark Gray", "Gold"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A2_Core"),
    "Galaxy A8s": (["Blue", "Gray", "Black", "Pink/Blue", "Yellow/Pink"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8s"),
    "Galaxy A9 Pro": (["Blue", "Gray", "Black"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8s"),
    "Galaxy A8 Star": (["Black", "White"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8_Star"),
    "Galaxy A9 Star": (["Black", "White"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8_Star"),
    "Galaxy A9 Star Lite": (["Black", "Blue"], "https://en.wikipedia.org/wiki/Samsung_Galaxy_A8_Star"),
    "Galaxy Z Fold Special Edition": (["Black Shadow"], "https://news.samsung.com/global/samsung-unveils-galaxy-z-fold-special-edition")
}

def map_model_to_article(m):
    if m in OFFICIAL_SOURCES: return None
    if "Note" in m:
        mn = re.search(r"Note\s*(\d+)", m)
        if mn: return f"Samsung Galaxy Note {mn.group(1)}"
    if "Fold" in m:
        mn = re.search(r"Fold\s*(\d+)", m)
        if mn: return f"Samsung Galaxy Z Fold {mn.group(1)}"
        return "Samsung Galaxy Fold"
    if "Flip" in m:
        mn = re.search(r"Flip\s*(\d+)", m)
        if mn: return f"Samsung Galaxy Z Flip {mn.group(1)}"
        return "Samsung Galaxy Z Flip"
    if re.match(r"Galaxy S\d+", m):
        mn = re.search(r"Galaxy S(\d+)", m)
        return f"Samsung Galaxy S{mn.group(1)}"
    if re.match(r"Galaxy A\d+", m):
        base = re.sub(r"\s*(5G|UW|Core|\(2018\)|2018)", "", m).strip()
        return f"Samsung {base}"
    return f"Samsung {m}"

def main():
    with open("docs/reference/device-lists/samsung-model-codes.csv") as f:
        models = sorted(list(set(row["model"] for row in csv.DictReader(f))))

    article_cache, out_rows, missing_models = {}, [], []

    for m in models:
        if m in OFFICIAL_SOURCES:
            colors, url = OFFICIAL_SOURCES[m]
            for c in colors: out_rows.append({"model": m, "color": c, "source_url": url})
            continue

        art_title = map_model_to_article(m)
        if not art_title:
            missing_models.append(m)
            continue

        if art_title not in article_cache:
            wt = get_page_wikitext(art_title)
            url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(art_title.replace(' ', '_'))}"
            if not wt or len(wt) < 200:
                s_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote('Samsung ' + m)}&limit=1&format=json"
                s_res = fetch_json(s_url)
                if s_res and len(s_res) > 1 and s_res[1]:
                    art_title, url = s_res[1][0], s_res[3][0]
                    wt = get_page_wikitext(art_title)
            article_cache[art_title] = (wt, url)
            time.sleep(0.12)

        wt, url = article_cache[art_title]
        colors = parse_colors_from_wikitext(wt, m) if wt else []

        if not colors and wt:
            cand = ["Phantom Black", "Phantom White", "Phantom Silver", "Phantom Violet", "Phantom Gray", "Phantom Pink",
                    "Mystic Bronze", "Mystic Black", "Mystic White", "Mystic Gray", "Mystic Green", "Aura Glow", "Aura Black",
                    "Aura White", "Aura Blue", "Aura Red", "Aura Pink", "Cosmic Black", "Cosmic Gray", "Cloud Blue",
                    "Awesome Black", "Awesome White", "Awesome Blue", "Awesome Violet", "Awesome Lime", "Awesome Graphite",
                    "Prism Black", "Prism White", "Prism Blue", "Prism Green", "Midnight Black", "Coral Blue", "Lilac Purple",
                    "Titanium Gray", "Burgundy Red", "Sunrise Gold", "Bora Purple", "Cream", "Lavender", "Graphite", "Mint"]
            for cc in cand:
                if re.search(r"\b" + re.escape(cc) + r"\b", wt, re.I): colors.append(cc)

        if not colors:
            missing_models.append(m)
            continue

        for c in colors: out_rows.append({"model": m, "color": c, "source_url": url})

    seen, deduped = set(), []
    for r in out_rows:
        key = (r["model"], r["color"].lower())
        if key not in seen:
            seen.add(key)
            deduped.append(r)

    with open("docs/reference/device-lists/samsung-colors.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "color", "source_url"])
        writer.writeheader()
        writer.writerows(deduped)

    covered = set(r["model"] for r in deduped)
    print(f"Wrote samsung-colors.csv: {len(deduped)} rows covering {len(covered)}/{len(models)} models.")
    print(f"Missing models ({len(missing_models)}): {missing_models}")

if __name__ == "__main__":
    main()
