#!/usr/bin/env python3
"""
build_apple_box_codes.py
Builds box-code CSV lists for iPad, Mac, Apple Watch, and AirPods from The Apple Wiki API.
Models from 2018 onwards.
"""

import csv
import json
import re
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"

def fetch_wiki_page(page_name):
    url = f"https://theapplewiki.com/api.php?action=parse&page={urllib.parse.quote(page_name)}&prop=text|revid&format=json"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))["parse"]
    return data["revid"], data["text"]["*"]

def parse_table_grid(table):
    rows = table.find_all("tr")
    grid = []
    for r_idx, tr in enumerate(rows):
        if r_idx >= len(grid):
            grid.append([])
        c_idx = 0
        for cell in tr.find_all(["td", "th"]):
            while c_idx < len(grid[r_idx]) and grid[r_idx][c_idx] is not None:
                c_idx += 1
            rowspan = int(cell.get("rowspan", 1))
            colspan = int(cell.get("colspan", 1))
            val = cell.get_text(separator=" ", strip=True)
            for i in range(rowspan):
                while len(grid) <= r_idx + i:
                    grid.append([])
                for j in range(colspan):
                    while len(grid[r_idx + i]) <= c_idx + j:
                        grid[r_idx + i].append(None)
                    grid[r_idx + i][c_idx + j] = (val, cell)
            c_idx += colspan
    return grid

def extract_box_codes(raw_text):
    clean = re.sub(r"\[.*?\]", "", raw_text).strip()
    if not clean or clean in ["?", "—"]:
        return []
    res = []
    for part in clean.split(","):
        p = re.sub(r"\(.*?\)", "", part).strip()
        tokens = re.findall(r"\b[A-Z0-9]{5}\b", p)
        for t in tokens:
            is_demo = t.startswith("3") or "[ 1 ]" in part or "[demo]" in part.lower()
            res.append((t, "demo" if is_demo else "retail"))
    return res

def build_ipad():
    pages = ["Models/iPad", "Models/iPad Air", "Models/iPad Pro", "Models/iPad mini"]
    ipad_2018_models = {
        "iPad (6th generation)", "iPad (7th generation)", "iPad (8th generation)",
        "iPad (9th generation)", "iPad (10th generation)", "iPad (A16)",
        "iPad Air (3rd generation)", "iPad Air (4th generation)", "iPad Air (5th generation)",
        "iPad Air 11-inch (M2)", "iPad Air 13-inch (M2)", "iPad Air 11-inch (M3)",
        "iPad Air 13-inch (M3)", "iPad Air 11-inch (M4)", "iPad Air 13-inch (M4)",
        "iPad Pro (11-inch)", "iPad Pro (11-inch) (2nd generation)", "iPad Pro (11-inch) (3rd generation)",
        "iPad Pro (11-inch) (4th generation)", "iPad Pro (12.9-inch) (3rd generation)",
        "iPad Pro (12.9-inch) (4th generation)", "iPad Pro (12.9-inch) (5th generation)",
        "iPad Pro (12.9-inch) (6th generation)", "iPad Pro 11-inch (M4)", "iPad Pro 13-inch (M4)",
        "iPad Pro 11-inch (M5)", "iPad Pro 13-inch (M5)",
        "iPad mini (5th generation)", "iPad mini (6th generation)", "iPad mini (A17 Pro)", "iPad mini (A20 Pro)"
    }
    rows = []
    seen_codes = set()
    revids = {}
    for p in pages:
        revid, html = fetch_wiki_page(p)
        revids[p] = revid
        soup = BeautifulSoup(html, "html.parser")
        t = soup.find("table")
        grid = parse_table_grid(t)
        headers = [c[0] for c in grid[0]]
        for r in grid[1:]:
            row_map = {headers[i]: r[i] for i in range(min(len(headers), len(r))) if r[i]}
            gen = re.sub(r"\[.*?\]", "", row_map.get("Generation", ("", None))[0]).strip()
            if gen not in ipad_2018_models:
                continue
            raw_a = row_map.get('"A" Number', ("", None))[0]
            a_numbers = " ".join(re.findall(r"A\d{4}", raw_a))
            ident = row_map.get("Identifier", ("", None))[0].strip()
            color = row_map.get("Finish", ("", None))[0].strip()
            raw_st = row_map.get("Storage", ("", None))[0].strip()
            st_m = re.search(r"(\d+)\s*(GB|TB)", raw_st, re.I)
            storage = f"{st_m.group(1)}{st_m.group(2).upper()}" if st_m else raw_st
            raw_models = row_map.get("Model", ("", None))[0]
            for code, unit_type in extract_box_codes(raw_models):
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                rows.append({
                    "model": gen,
                    "a_numbers": a_numbers,
                    "identifier": ident,
                    "color": color,
                    "storage": storage,
                    "box_code": code,
                    "unit_type": unit_type
                })

    with open("docs/reference/device-lists/ipad-box-codes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "a_numbers", "identifier", "color", "storage", "box_code", "unit_type"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote ipad-box-codes.csv ({len(rows)} rows). Revids: {revids}")
    return revids

def build_mac():
    revid, html = fetch_wiki_page("Models/Mac")
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    mac_tables = [19, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32]

    def parse_st_ram(text):
        ram = ""
        storage = ""
        m_ram = re.search(r"(\d+)\s*(?:GB\s*)?RAM", text, re.IGNORECASE)
        if m_ram:
            ram = m_ram.group(1) + "GB"
        text_no_ram = re.sub(r"\(\s*\d+\s*(?:GB\s*)?RAM[^)]*\)", "", text, flags=re.IGNORECASE)
        m_st = re.search(r"(\d+)\s*(GB|TB)", text_no_ram, re.IGNORECASE)
        if m_st:
            storage = f"{m_st.group(1)}{m_st.group(2).upper()}"
        return storage, ram

    rows = []
    seen_codes = set()
    for idx in mac_tables:
        if idx >= len(tables):
            continue
        grid = parse_table_grid(tables[idx])
        if not grid:
            continue
        headers = [c[0] for c in grid[0]]
        for r in grid[1:]:
            row_map = {headers[i]: r[i] for i in range(min(len(headers), len(r))) if r[i]}
            gen = re.sub(r"\[.*?\]", "", row_map.get("Generation", ("", None))[0]).strip()
            m_yr = re.search(r"\b(20\d\d)\b", gen)
            is_recent = False
            if m_yr and int(m_yr.group(1)) >= 2018:
                is_recent = True
            elif any(chip in gen for chip in ["M1", "M2", "M3", "M4", "M5", "Neo"]):
                is_recent = True
            if not is_recent or gen.startswith("Developer Transition"):
                continue

            raw_a = row_map.get('"A" Number', row_map.get('"A" or "M" Number', ("", None)))[0]
            a_numbers = " ".join(re.findall(r"A\d{4}", raw_a))
            ident = row_map.get("Identifier", ("", None))[0].strip()
            color = row_map.get("Color", ("", None))[0].strip()
            if color == "—":
                color = ""
            raw_st = row_map.get("Storage", row_map.get("Processor/Storage", ("", None)))[0]
            storage, ram = parse_st_ram(raw_st)
            raw_models = row_map.get("Model", ("", None))[0]
            for code, unit_type in extract_box_codes(raw_models):
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                rows.append({
                    "model": gen,
                    "a_numbers": a_numbers,
                    "identifier": ident,
                    "color": color,
                    "storage": storage,
                    "ram": ram,
                    "box_code": code,
                    "unit_type": unit_type
                })

    with open("docs/reference/device-lists/mac-box-codes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "a_numbers", "identifier", "color", "storage", "ram", "box_code", "unit_type"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote mac-box-codes.csv ({len(rows)} rows). Revid: {revid}")
    return {"Models/Mac": revid}

def build_watch():
    revid, html = fetch_wiki_page("Models/Apple Watch")
    soup = BeautifulSoup(html, "html.parser")
    t = soup.find_all("table")[0]
    grid = parse_table_grid(t)
    headers = [c[0] for c in grid[0]]

    rows = []
    seen_codes = set()
    for r in grid[1:]:
        row_map = {headers[i]: r[i] for i in range(min(len(headers), len(r))) if r[i]}
        gen = re.sub(r"\[.*?\]", "", row_map.get("Generation", ("", None))[0]).strip()
        if any(old in gen for old in ["1st generation", "Series 1", "Series 2", "Series 3"]):
            continue
        raw_a = row_map.get('"A" Number', ("", None))[0]
        a_numbers = " ".join(re.findall(r"A\d{4}", raw_a))
        ident = row_map.get("Identifier", ("", None))[0].strip()
        mat = row_map.get("Case Material", ("", None))[0].strip()
        fin = row_map.get("Finish", ("", None))[0].strip()
        if mat.lower() in fin.lower():
            color = fin
        else:
            color = f"{fin} {mat}"
        size = row_map.get("Case Size", ("", None))[0].strip()
        raw_models = row_map.get("Model", ("", None))[0]
        for code, unit_type in extract_box_codes(raw_models):
            if code in seen_codes:
                continue
            seen_codes.add(code)
            rows.append({
                "model": gen,
                "a_numbers": a_numbers,
                "identifier": ident,
                "color": color,
                "storage": size,
                "box_code": code,
                "unit_type": unit_type
            })

    with open("docs/reference/device-lists/watch-box-codes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "a_numbers", "identifier", "color", "storage", "box_code", "unit_type"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote watch-box-codes.csv ({len(rows)} rows). Revid: {revid}")
    return {"Models/Apple Watch": revid}

def build_airpods():
    revid, html = fetch_wiki_page("Models/AirPods")
    soup = BeautifulSoup(html, "html.parser")
    grid = parse_table_grid(soup.find("table"))
    headers = [c[0] for c in grid[0]]

    rows = []
    seen_codes = set()
    for r in grid[1:]:
        row_map = {headers[i]: r[i] for i in range(min(len(headers), len(r))) if r[i]}
        gen = re.sub(r"\[.*?\]", "", row_map.get("Generation", ("", None))[0]).strip()
        if "1st generation" in gen:
            continue
        raw_a = row_map.get('"A" Number', ("", None))[0]
        a_numbers = " ".join(re.findall(r"A\d{4}", raw_a))
        ident = row_map.get("Identifier", ("", None))[0].strip()
        color = row_map.get("Color", ("", None))[0].strip()
        if not color or color == "—":
            color = "White"
        raw_models = row_map.get("Model", ("", None))[0]
        for code, unit_type in extract_box_codes(raw_models):
            if code in seen_codes:
                continue
            seen_codes.add(code)
            rows.append({
                "model": gen,
                "a_numbers": a_numbers,
                "identifier": ident,
                "color": color,
                "storage": "",
                "box_code": code,
                "unit_type": unit_type
            })

    with open("docs/reference/device-lists/airpods-box-codes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "a_numbers", "identifier", "color", "storage", "box_code", "unit_type"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote airpods-box-codes.csv ({len(rows)} rows). Revid: {revid}")
    return {"Models/AirPods": revid}

if __name__ == "__main__":
    revs = {}
    revs.update(build_ipad())
    revs.update(build_mac())
    revs.update(build_watch())
    revs.update(build_airpods())
    with open("docs/reference/device-lists/tools/apple_wiki_revids.json", "w") as f:
        json.dump(revs, f, indent=2)
