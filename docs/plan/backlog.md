# Backlog

Work that is agreed but not started. One line each; the detail is in the file it points to.
Updated by Claude when something is added, started or finished. Last update: 2026-11-06.

## In progress now (not backlog, listed so nothing is counted twice)
- Online storefront, server and website (`docs/handoffs/gemini/022`): checked by Claude on 2026-11-06, no critical or serious security problem; a fix list is with Gemini (`docs/handoffs/gemini/025-storefront-fixes.md`). Merged when that is done.
- First-boot setup, branding and themes (`docs/handoffs/gemini/024`): checked by Claude on 2026-11-06 and not mergeable yet: the wizard cannot finish from the screen, there are two secrets stores, themes are half done, one serious security item. Fix list: `docs/handoffs/gemini/026-setup-fixes.md`.
- Danger zone (erase the shop's data): `docs/handoffs/opus48/002-danger-zone.md`. Started 2026-11-06 with Opus 4.8, Claude running and checking it.

## Ready to start (a handoff is written)
| What | Handoff | Notes |
|---|---|---|
| Uzbek text for offline sync | `docs/handoffs/gemini/013` | Old, small. |
| Exact Samsung colors and memory from GSMArena | `docs/handoffs/gemini/016` | The site blocked this computer once; try again slowly. |
| Branches on the phone apps (choose a store, send it with every request, switch it) | `docs/handoffs/gemini/027-mobile-branches.md` | Written 2026-11-06. Until it is done a user of two stores gets an error on the phones. |

## Agreed, handoff not written yet
| What | Depends on | Notes |
|---|---|---|
| Uzbek for all the English text added by step 11 on the website (handoffs 003 to 009), and a native check of the Uzbek written by Opus 4.8 for backups and the danger zone | nothing: step 11 on the website is merged | For Gemini, one pass. |
| Step 11 on the phone apps (bonus points, printing, buy-back) | step 11 website done | Android and iOS. |
| Storefront orders on the phone apps | handoff 022 merged | Read the list, change the status. |
| Mobile Uzbek strings | nothing | Gemini 014, reserved, never written. |
| The till at phone width with very large amounts; every dialog | nothing | Left unchecked after the money overflow fix (`docs/handoffs/opus48/001`). |

## Waiting on someone else
| What | Waiting on |
|---|---|
| Backup places: one real try of Telegram, Google Drive and OneDrive (built and merged 2026-11-06, tested against fake servers only) | The user: make a Telegram backup chat, register the Google and Microsoft apps (steps in `server/README.md`, "Storage places"), connect each on the Backups page and press Test. |
| A lasting data folder on the server (`DATA_DIR`) and `pg_dump` on Railway | The user, at the next deploy: without a volume the backup passphrase and every stored login must be typed again after each deploy. |
| Customs fee Excel upload | The client's real Excel file (asked 2026-11-04). |
| PRD text for the 15 changes, branches and backup providers | The user pastes it into `docs/PRD.md`; Claude writes the text on request. |
| Pushing to Railway (198+ commits are local only) | The user. After a push: run the seed, `pnpm ref:import`, and give uploads a volume. |

## Later, only when asked
- Tax receipts (Change 15).
- Storefront second version: online payment, reservation, delivery, customer login.
- S3-style storage as one more backup provider.
- Deleting the dead worktree and branch `agent/opencode/branches-server`.
