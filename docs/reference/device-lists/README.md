# Device lists (reference data)

Free lists for finding a device from its code. Built on 2026-11-05 by Claude
and Gemini (handoff 015), then checked by Claude against the sources. Nothing
in the app reads these files yet; they are the input for Change 5 in
`docs/plan/store-balance.md`.

## Files and how far to trust each

| File | Rows | You give | It tells you | Trust |
|---|---|---|---|---|
| `iphone-box-codes.csv` | 2,910 | box code, e.g. `MU793` | model, color, storage | Exact copy of the source |
| `ipad-box-codes.csv` | 1,108 | box code | model, color, storage | Exact; every row re-checked |
| `mac-box-codes.csv` | 414 | box code | model, color, storage, RAM | Exact; every row re-checked |
| `watch-box-codes.csv` | 865 | box code | model, finish + case material, case size (in `storage`) | Exact; every row re-checked |
| `airpods-box-codes.csv` | 37 | box code | model, color (only where the source states one) | Exact |
| `samsung-model-codes.csv` | 948 | model code, e.g. `SM-S918B` | series and model name | Exact copy of Google's list |
| `imei-tac.csv` | 22,880 | first 8 digits of the IMEI | brand and model | Community list; may have gaps |
| `samsung-ram-storage.csv` | 169 | model name | RAM and storage sizes | **Suggestions only** |
| `samsung-color-suggestions.csv` | 951 | model name | colors to offer in a pick list | **Suggestions only** |
| `model-pictures.csv` | 71 | brand and model | free picture URL, license, author | Matched by file name, not viewed |

## What is inside

- **iPhone:** 38 models, iPhone X to iPhone 18 Pro Max and iPhone Duo.
- **iPad, Mac, Watch, AirPods:** models from 2018 on. Watch covers Series 4 to 12, SE, SE 3, Ultra to Ultra 4.
- **Samsung:** 171 models from 2018 on: S9 to S26 Ultra, Note9 to Note20 Ultra, A series, Z Fold / Z Flip.

## Read this before loading the three weak files

- **`samsung-color-suggestions.csv`** A row is here only if its color text appears on the page it
  cites. But Wikipedia has one page per family, so a model can list a color that only its sibling
  has (S23 Ultra shows S23 FE colors). 150 of 171 models have rows. Use it to fill a pick list the
  seller chooses from. Never use it to decide a phone's color.
- **`samsung-ram-storage.csv`** Most rows come from TechAPI, which marks most of its own records
  unverified. The `note` column marks 13 rows edited and 9 rows added by hand in handoff 015; those
  were typed, not downloaded, and are not checked.
- **`model-pictures.csv`** 23 iPhone and 48 Samsung models. A row is kept only when the Commons file
  name names that exact model, the file exists and its license matches. Nobody looked at the
  pictures one by one. 5 pictures serve both a model and its 5G twin.

## Sources and licenses

| File | Source | License |
|---|---|---|
| Apple box codes (5 files) | The Apple Wiki via `theapplewiki.com/api.php`; revisions: iPhone 349175, iPad 344369, iPad Air 347646, iPad Pro 338685, iPad mini 349206, Mac 351175, Apple Watch 347704, AirPods 348424 | CC BY-SA: credit them, share changes to the list the same way |
| `samsung-model-codes.csv` | Google Play supported devices, `storage.googleapis.com/play_public/supported_devices.csv` | none stated |
| `samsung-ram-storage.csv` | TechAPI, `github.com/GetTechAPI/TechAPI`, commit 9a951d65, plus hand edits (see `note`) | CC BY-SA 4.0: credit "Data from TechAPI" |
| `samsung-color-suggestions.csv` | English Wikipedia, one `source_url` per row | CC BY-SA 4.0 |
| `model-pictures.csv` | Wikimedia Commons; license and author on every row | per row |
| `imei-tac.csv` | `github.com/MoazEb/tac-database`, `tac_full.csv` | MIT |

## Tools (`tools/`)

- `build_apple_box_codes.py` builds the iPad, Mac, Watch and AirPods files. It skips Watch Series
  10 to 12; those 244 rows were added by hand from the same page revision.
- `clean_lists.py` is the checking pass: confirms colors against their cited page, filters pictures,
  blanks AirPods colors the source does not state. Run it after the two scripts below.
- `build_samsung_colors.py`, `build_model_pictures.py`, `fix_samsung_ram_storage.py` are Gemini's
  first pass. Their raw output is **not usable** without `clean_lists.py`: the colors script holds a
  hand-typed table and the pictures script accepts unrelated photos.
- `verify_device_lists.py` checks columns and duplicate keys only. It does not check values.
- The script that built the iPhone, Samsung model-code and IMEI files was not saved.

## Known gaps

- No free list gives exact colors per Samsung model, or the long Samsung codes (`SM-S918BZKDEUB`).
- 21 Samsung models have no color suggestion; 123 have no picture; 15 iPhones have no picture.
- Dropped in the checking pass: 172 color rows (broken text, duplicates, 54 not on the cited page,
  25 on Samsung newsroom pages that could not be read) and 121 pictures (churches, logos, wrong models).
- iPhone: 6 wiki cells skipped (`?` or a mistyped code); 7 box codes appear twice in the wiki.
- Mac: the four newest models are missing though the wiki has their codes (47 box codes): iMac
  (24-inch, M6), MacBook Pro (14-inch, M6), MacBook Pro 14-inch and 16-inch PROLED XDR Display.
  `build_apple_box_codes.py` skips them.

## Samsung colors and memory

Samsung colors and storage/RAM configurations are provided by:
- `samsung-color-suggestions.csv`: English Wikipedia color suggestions per model family.
- `samsung-ram-storage.csv`: TechAPI memory configurations per model.
These files are combined with `samsung-model-codes.csv` during `pnpm ref:import` to populate available options for Samsung devices.
