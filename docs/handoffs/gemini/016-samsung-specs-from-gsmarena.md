# 016 — Exact Samsung colors and memory from GSMArena

Status: blocked, retry after 2026-11-05 20:30 local · Owner: Gemini (Antigravity) · Depends on: handoff 015 and Claude's check of it (`docs/reference/device-lists/README.md`)

## Why
Handoff 015 could not produce trustworthy Samsung colors: Wikipedia has one page per family, so every
phone got its whole family's colors, 54 rows were on no page at all, and the report said "20/20
checks matched" when they did not. GSMArena has one page per exact phone with the three facts we
lack: colors, RAM + storage pairs, model codes. The user decided on 2026-11-05 to read them once,
slowly. GSMArena blocks fast readers: three quick requests were enough to get "Too Many Requests".
This is data only. No app code, nothing in `server/`, `client/` or `mobile/`.

=== MESSAGE ===
Read `docs/reference/device-lists/README.md` first. You will read GSMArena phone pages once, slowly, and build exact Samsung colors and memory sizes for the 171 models in `docs/reference/device-lists/samsung-model-codes.csv`. Work only inside `docs/reference/device-lists/`.

Rules. The last handoff broke the first two; do not repeat that.
- No value may be typed by you. Scripts must not contain tables, dictionaries or lists of colors, sizes or model names. Every value in every output file must be copied by the script from a page it downloaded. Claude will re-download random pages and compare.
- Report only what you measured. If a check fails or you skipped it, say so. Do not write "all matched" unless you ran the comparison and it printed that.
- Be slow: at most one request to gsmarena.com every 12 seconds, one at a time, with a normal browser User-Agent. If you get HTTP 429 or "Too Many Requests", stop for 15 minutes, then continue. Never retry in a loop.
- Save every downloaded page under `docs/reference/device-lists/tools/.cache/gsmarena/` and read from that cache on every later run, so no page is downloaded twice. Add `tools/.cache/` to `docs/reference/device-lists/.gitignore`. Do not commit the cache.
- Take facts only: the text of the `Colors`, `Internal` (memory) and `Models` rows of the spec table, plus the page URL. Do not download, link or copy GSMArena pictures, reviews, prices or descriptions.
- Read only what is needed: the Samsung brand list pages to find phone page addresses, then one page per phone we need. Do not use the site search (it is blocked) and do not crawl other brands.
- Do not change the Apple files, `samsung-model-codes.csv`, `imei-tac.csv`, `model-pictures.csv` or `tools/clean_lists.py`.

Steps:
1. Find the pages. Walk the Samsung brand list (`https://www.gsmarena.com/samsung-phones-9.php` and its next pages) and keep the phones named Galaxy S, Note, A or Z from 2018 on. Download each phone page once.
2. Write `samsung-gsmarena-raw.csv`, one row per downloaded phone page: `gsmarena_name, source_url, models, colors, internal`. The last three are the page's own text, unchanged.
3. Match pages to our models by model code, not by name: a page belongs to one of our models when a code in its `Models` text equals a `model_code` in `samsung-model-codes.csv` (ignore a trailing `/DS`). List our models that matched no page, and pages that matched more than one of our models.
4. From the raw file, by script only, write:
   - `samsung-colors.csv` (`model, color, source_url`): one row per model and color, split on commas.
   - `samsung-memory.csv` (`model, storage, ram, source_url`): one row per pair in `Internal`, written like `256GB`, `1TB`, `12GB`.
   Leave `samsung-color-suggestions.csv` and `samsung-ram-storage.csv` as they are; Claude removes them after checking yours.
5. Checks, run by script, with the printed output pasted into the Result: number of our 171 models with colors and with memory; no duplicate `model + color` and no duplicate `model + storage + ram`; no value containing `<`, `>`, `{`, a line break or more than 40 characters; for 15 random models, print our row next to the raw text it came from.
6. Save the scripts in `tools/` (each under 300 lines) and add a section to the README: the two new files, source, the date read, and the gaps.

Commit as `docs: exact samsung colors and memory from gsmarena`. Add files by name with `git add`: only the three new CSV files, your new scripts, the `.gitignore` and `README.md`. Other files in that folder have changes that are not yours; leave them alone. Fill the Result section of `docs/handoffs/gemini/016-samsung-specs-from-gsmarena.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit: `efd0b5c`
- Pages downloaded / times blocked (429): 0 / 2 (GSMArena sent HTTP 429 with `Retry-After: 36000`, 10-hour IP block)
- Our models with colors / with memory (of 171): 0 / 0
- Our models that matched no page: all 171 models (no pages could be downloaded due to the 10-hour IP block)
- Output of the check script (paste):
```
=== CHECK REPORT FOR GSMARENA SAMSUNG DATA ===
Total reference models: 171

1. MODEL COVERAGE:
   Models with colors: 0 / 171 (0 total rows)
   Models with memory: 0 / 171 (0 total rows)

2. DUPLICATE KEY CHECKS:
   Duplicate (model + color): 0
   Duplicate (model + storage + ram): 0

3. INVALID VALUE CHECKS (<, >, {, line break, > 40 chars in model/color/storage/ram):
   Invalid color values: 0
   Invalid memory values: 0

4. VERIFICATION OF 15 RANDOM MODELS (OUR ROWS VS RAW TEXT):
```
- Anything skipped or failed:
  - GSMArena returned HTTP 429 Too Many Requests on the very first request to `https://www.gsmarena.com/samsung-phones-9.php`.
  - Response headers inspected: `Server: Apache`, `Retry-After: 36000` (10 hours).
  - The script paused for the required 15 minutes, retried once, and was blocked again with HTTP 429 `Retry-After: 36000`.
  - In compliance with behavioral rules ("Never retry in a loop" and "Never defeat or bypass an access control, network/proxy restriction... if blocked, report the error and stop"), crawling stopped and was not looped or bypassed.
- Notes for other agents:
  - All three tools are implemented and tested, each under 300 lines:
    - `docs/reference/device-lists/tools/scrape_gsmarena.py` (245 lines): rate-limited crawler with cache in `tools/.cache/gsmarena/`.
    - `docs/reference/device-lists/tools/build_samsung_from_gsmarena.py` (159 lines): parser and matcher against `samsung-model-codes.csv`.
    - `docs/reference/device-lists/tools/check_gsmarena.py` (129 lines): verification and coverage reporter.
  - The cache directory `tools/.cache/` is added to `docs/reference/device-lists/.gitignore`.
  - Once the 10-hour `Retry-After` block on the IP expires, running `python3 docs/reference/device-lists/tools/scrape_gsmarena.py` will populate the cache and generate `samsung-gsmarena-raw.csv`, after which `build_samsung_from_gsmarena.py` will populate `samsung-colors.csv` and `samsung-memory.csv`.

## Check by Claude (2026-11-05)
The report above holds: no page was downloaded, so `samsung-gsmarena-raw.csv`, `samsung-colors.csv`
and `samsung-memory.csv` contain only their header row. GSMArena answered the first request with
HTTP 429 and `Retry-After: 36000` (10 hours). Claude's own three test requests earlier that morning
probably caused the block. The scripts hold no hand-typed values. To finish: after the block ends,
run `tools/scrape_gsmarena.py`, then `tools/build_samsung_from_gsmarena.py`, then `tools/check_gsmarena.py`.
Until then use `samsung-color-suggestions.csv` and `samsung-ram-storage.csv`.
