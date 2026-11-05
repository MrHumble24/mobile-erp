# Device lists (reference data)

Free lists for finding a device from its code. Downloaded and cleaned on
2026-11-05. Nothing in the app reads these files yet; they are the input
for Change 5 in `docs/plan/store-balance.md`.

## Files

| File | Rows | You give | It tells you |
|---|---|---|---|
| `iphone-box-codes.csv` | 2,910 | box code, e.g. `MU793` | model, color, storage, `A` numbers |
| `ipad-box-codes.csv` | 1,108 | box code, e.g. `MM9C3` | model, color, storage, `A` numbers |
| `mac-box-codes.csv` | 414 | box code, e.g. `MXCM3` | model, color, storage, RAM, `A` numbers |
| `watch-box-codes.csv` | 621 | box code, e.g. `MTVU2` | model, color, case size (`storage`), `A` numbers |
| `airpods-box-codes.csv` | 37 | box code, e.g. `MTJV3` | model, color, `A` numbers |
| `samsung-model-codes.csv` | 948 | model code, e.g. `SM-S918B` | series and model name |
| `samsung-ram-storage.csv` | 169 | model name | RAM and storage configurations |
| `samsung-colors.csv` | 1,123 | model name | official English color name and source URL |
| `model-pictures.csv` | 192 | brand and model | free front photo URL, license, and author |
| `imei-tac.csv` | 22,880 | first 8 digits of the IMEI | brand and model |

## What is inside

- **iPhone:** 38 models, iPhone X up to iPhone 18 Pro Max and iPhone Duo (2,558 retail, 352 demo codes).
- **iPad:** iPad, iPad Air, iPad Pro, iPad mini from 2018 to present (1,108 box codes).
- **Mac:** MacBook Pro, MacBook Air, iMac, Mac mini, Mac Studio, Mac Pro from 2018 to present with `ram` sizes (414 box codes).
- **Apple Watch:** Series 4 through Series 10, SE (1st & 2nd gen), Ultra 1 & 2 (621 box codes, case size in `storage` e.g. `40mm`, `44mm`).
- **AirPods:** 2nd, 3rd, 4th gen, Pro 1 & 2, Max 1 & 2 (37 box codes).
- **Samsung models:** 171 models from 2018 on (S9 to S26 Ultra, Note9 to Note20 Ultra, A series from 2018, Z Fold / Z Flip).
- **Samsung RAM & storage:** 169 models with verified RAM and storage configurations. S, Note, and Z series checked against official Samsung specs and Wikipedia.
- **Samsung colors:** 1,123 rows across 169 models detailing official English color variants with exact source URLs.
- **Pictures:** 192 models (38 Apple iPhones and 154 Samsung models) with front pictures sourced strictly from Wikimedia Commons under free licenses (CC BY, CC BY-SA, Public Domain).
- **Samsung full codes (SKUs):** Omitted. No trustworthy open-licensed public database exists for retail part numbers like `SM-S918BZKDEUB`.

## Sources and licenses

| File | Source | License |
|---|---|---|
| `iphone-box-codes.csv` | The Apple Wiki, page `Models/iPhone`, revision 349175, via `theapplewiki.com/api.php` | CC BY-SA |
| `ipad-box-codes.csv` | The Apple Wiki, pages `Models/iPad` (revid 344369), `Models/iPad Air` (revid 347646), `Models/iPad Pro` (revid 338685), `Models/iPad mini` (revid 349206) | CC BY-SA |
| `mac-box-codes.csv` | The Apple Wiki, page `Models/Mac`, revision 351175 | CC BY-SA |
| `watch-box-codes.csv` | The Apple Wiki, page `Models/Apple Watch`, revision 347704 | CC BY-SA |
| `airpods-box-codes.csv` | The Apple Wiki, page `Models/AirPods`, revision 348424 | CC BY-SA |
| `samsung-model-codes.csv` | Google Play supported devices, `storage.googleapis.com/play_public/supported_devices.csv` | none stated |
| `samsung-ram-storage.csv` | TechAPI (commit 9a951d65) + official Samsung specifications / Wikipedia | CC BY-SA 4.0 / Fair Use facts |
| `samsung-colors.csv` | Official Samsung Newsroom & Wikipedia | CC BY-SA 4.0 / Fair Use facts |
| `model-pictures.csv` | Wikimedia Commons API (`prop=imageinfo`, `pilicense=free`) | CC BY, CC BY-SA, Public Domain per row |
| `imei-tac.csv` | `github.com/MoazEb/tac-database`, `tac_full.csv` | MIT |

## Maintenance & Refresh Scripts

All generator and verification scripts are saved under `docs/reference/device-lists/tools/` (each strictly under 300 lines):
- `build_apple_box_codes.py`: Fetches and parses The Apple Wiki MediaWiki API with full table `rowspan` unrolling and demo unit tagging.
- `fix_samsung_ram_storage.py`: Audits and fixes Samsung RAM & storage configs against Wikipedia and official sources, and fills missing models.
- `build_samsung_colors.py`: Extracts and populates official English Samsung color names and source links.
- `build_model_pictures.py`: Queries Wikimedia Commons for lead front-facing device photos with license and artist metadata.
- `verify_device_lists.py`: Validates CSV schemas, ensures zero duplicate keys, zero empty models, and runs random 20-sample spot checks.

## Known gaps

- **Samsung full codes:** No free open-licensed source exists for full Samsung retail part numbers (e.g. `SM-S918BZKDEUB`). Skipped to avoid guessing.
- **Samsung RAM/storage:** 2 unreleased models listed in Google Play supported devices lack published RAM/storage specs: Galaxy A07s and Galaxy S26 FE.
- **Samsung colors:** 2 models lack official color listings: Galaxy A07s (unreleased) and Galaxy Z TriFold (concept device).
- **Model pictures:** 17 Samsung models (mainly carrier-specific US variants like A23 5G UW, A53 5G UW, or unreleased A07s/A08/A18/A27/S26/Z Flip8) do not currently have free-licensed front photos on Wikimedia Commons. Per instructions, missing pictures are omitted (no row).
- **Apple box codes:** The Apple Wiki has a few typo cells or shared demo codes. All accurately unrolled and preserved per wiki records.
