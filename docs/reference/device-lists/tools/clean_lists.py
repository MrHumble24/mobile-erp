#!/usr/bin/env python3
"""
clean_lists.py — second pass over the lists Gemini built (handoff 015).

Keeps only what can be confirmed against the cited source:
  colors    samsung-colors.csv -> samsung-color-suggestions.csv
            a row stays only if its color text really appears in the page it cites
  pictures  model-pictures.csv: a row stays only if the Commons file name names
            that exact model, the file still exists and its license matches
  airpods   airpods-box-codes.csv: blank the colors the wiki does not state

Run from anywhere: python3 clean_lists.py [colors] [pictures] [airpods]
"""
import csv
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")


def fetch(url, tries=3):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", "replace")
        except Exception:
            time.sleep(2 * (attempt + 1))
    return ""


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write(name, fields, rows):
    with open(os.path.join(HERE, name), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"{name}: {len(rows)} rows")


def squash(text):
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


# ---------------------------------------------------------------- colors
def wiki_texts(urls):
    """url -> wikitext, fetched 20 pages per request so Wikipedia does not throttle us."""
    by_title = {urllib.parse.unquote(u.split("/wiki/")[1]).replace("_", " "): u for u in urls}
    out, titles = {}, list(by_title)
    for i in range(0, len(titles), 20):
        chunk, cont = titles[i:i + 20], {}
        while True:
            params = {"action": "query", "prop": "revisions", "rvprop": "content", "rvslots": "main",
                      "redirects": "1", "format": "json", "formatversion": "2",
                      "titles": "|".join(chunk), **cont}
            data = json.loads(fetch("https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)) or "{}")
            q = data.get("query", {})
            hop = {x["from"]: x["to"] for x in q.get("normalized", []) + q.get("redirects", [])}
            content = {p["title"]: p["revisions"][0]["slots"]["main"]["content"]
                       for p in q.get("pages", []) if p.get("revisions")}
            for t in chunk:
                final = hop.get(hop.get(t, t), hop.get(t, t))
                if final in content:
                    out[by_title[t]] = content[final]
            cont = data.get("continue", {})
            time.sleep(1)
            if not cont:
                break
    return out


def page_text(url):
    """Plain text of a non-Wikipedia page (Samsung newsroom)."""
    return html.unescape(re.sub(r"<[^>]+>", " ", fetch(url)))


def clean_color(value):
    value = value.strip()
    if re.search(r"[<>{}|=:]|'''", value):
        return ""
    value = re.sub(r"\s+with \w+ frame$", "", value, flags=re.I)
    return value if 2 < len(value) < 35 else ""


def colors():
    rows, kept, seen, dropped = read("samsung-colors.csv"), [], set(), []
    wiki = wiki_texts({r["source_url"] for r in rows if "wikipedia.org/wiki/" in r["source_url"]})
    pages = {u: squash(t) for u, t in wiki.items()}
    for u in {r["source_url"] for r in rows if "wikipedia.org/wiki/" in r["source_url"]} - set(pages):
        pages[u] = ""
    for r in rows:
        color, url = clean_color(r["color"]), r["source_url"]
        key = (r["model"], color.lower())
        if not color or key in seen:
            continue
        if url not in pages:
            pages[url] = squash(page_text(url))
            time.sleep(0.2)
        if f" {squash(color)} " in f" {pages[url]} ":
            seen.add(key)
            kept.append({"model": r["model"], "color": color, "source_url": url})
        else:
            dropped.append((r["model"], color, "page unreadable" if not pages[url] else "not on page"))
    write("samsung-color-suggestions.csv", ["model", "color", "source_url"], kept)
    os.remove(os.path.join(HERE, "samsung-colors.csv"))
    models = {r["model"] for r in read("samsung-model-codes.csv")}
    print(f" read {len(rows)}, kept {len(kept)}, pages unreadable: "
          f"{sorted(u for u, t in pages.items() if not t)}")
    print(f" dropped (not confirmed by the cited page): {len(dropped)}")
    for d in dropped[:400]:
        print("  ", d)
    print(" models with no color left:", sorted(models - {r['model'] for r in kept}))


# -------------------------------------------------------------- pictures
VARIANTS = ["ultra", "plus", "fe", "pro", "max", "mini", "lite", "edge", "core", "star",
            "fold", "flip", "note", "se", "air", "duo", "5g", "trifold", "special"]
BAD_WORDS = ["logo", "back", "rear", "box", "case", "shop", "store", "museum", "series"]


def model_tokens(model):
    m = model.lower().replace("+", " plus ").replace("(", " ").replace(")", " ")
    m = re.sub(r"\b(galaxy|generation|z|uw)\b", " ", m)
    m = re.sub(r"\b(\d)(st|nd|rd|th)\b", r"\1", m)
    return [t for t in m.split() if t]


def file_tokens(url):
    name = urllib.parse.unquote(url.split("/")[-1].split("?")[0]).lower()
    name = name.replace("+", " plus ").rsplit(".", 1)[0]
    name = re.sub(r"samsung|galaxy|(?<!i)phone", " ", name)          # GalaxyA70Phone -> a70
    name = re.sub(r"(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])", " ", name)   # a54 -> a 54, s10e -> s 10 e
    return re.sub(r"[^a-z0-9]+", " ", name).split(), name


def names_model(model, url):
    want = model_tokens(model)
    want = re.sub(r"(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])", " ", " ".join(want)).split()
    have, raw = file_tokens(url)
    if any(b in raw for b in BAD_WORDS):
        return False
    if f" {' '.join(want)} " not in f" {' '.join(have)} ":
        return False
    extra = [v for v in VARIANTS if v in have and v not in want]
    if "5g" in extra:
        extra.remove("5g")          # a 5G file may illustrate the plain model's look
    letters = [t for t in have if re.fullmatch(r"[es]", t) and t not in want]
    return not extra and not letters


def commons_info(urls):
    """image url -> (exists, license short name) from the Commons API."""
    out, titles = {}, {}
    for u in urls:
        titles["File:" + urllib.parse.unquote(u.split("/")[-1].split("?")[0]).replace("_", " ")] = u
    names = list(titles)
    for i in range(0, len(names), 40):
        api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo"
               "&iiprop=extmetadata&titles=" + urllib.parse.quote("|".join(names[i:i + 40])))
        data = json.loads(fetch(api) or "{}").get("query", {})
        norm = {n["to"]: n["from"] for n in data.get("normalized", [])}
        for p in data.get("pages", {}).values():
            title = norm.get(p.get("title"), p.get("title"))
            info = (p.get("imageinfo") or [{}])[0].get("extmetadata", {})
            if title in titles:
                out[titles[title]] = ("missing" not in p, info.get("LicenseShortName", {}).get("value", ""))
        time.sleep(0.3)
    return out


def pictures():
    rows = read("model-pictures.csv")
    named = [r for r in rows if names_model(r["model"], r["image_url"])]
    info = commons_info({r["image_url"] for r in named})
    kept, why = [], []
    for r in named:
        exists, lic = info.get(r["image_url"], (False, ""))
        if not exists:
            why.append((r["model"], "file not found on Commons"))
        elif squash(lic) != squash(r["license"]):
            why.append((r["model"], f"license differs: file says {lic!r}, row says {r['license']!r}"))
        else:
            r["image_url"] = r["image_url"].split("?")[0]
            kept.append(r)
    write("model-pictures.csv", list(rows[0].keys()), kept)
    print(f" read {len(rows)}, file name names the model: {len(named)}, kept {len(kept)}")
    for w in why:
        print("  dropped:", w)
    print(" dropped for file name:", sorted(r["model"] for r in rows if r not in named))


# --------------------------------------------------------------- airpods
def airpods():
    """The wiki states a color only for AirPods Max; Gemini filled 'White' elsewhere."""
    rows = read("airpods-box-codes.csv")
    changed = 0
    for r in rows:
        if r["color"] == "White" and "Max" not in r["model"]:
            r["color"], changed = "", changed + 1
    write("airpods-box-codes.csv", list(rows[0].keys()), rows)
    print(f" blanked {changed} colors the source does not state")


if __name__ == "__main__":
    steps = sys.argv[1:] or ["colors", "pictures", "airpods"]
    for step in steps:
        {"colors": colors, "pictures": pictures, "airpods": airpods}[step]()
