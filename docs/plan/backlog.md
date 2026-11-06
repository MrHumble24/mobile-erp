# Backlog

Work that is agreed but not started. One line each; the detail is in the file it points to.
Updated by Claude when something is added, started or finished. Last update: 2026-11-06.

## In progress now (not backlog, listed so nothing is counted twice)
- Nothing is with a builder right now. Merged on 2026-11-06: the online storefront (022, 025), first-boot setup with company profile and themes (024, 026; dark themes switched off), the danger zone (opus48/002), OpenCode 010 and 011 (fixed black and white out of the website), branches on the phone apps (Gemini 027), OpenCode 012 (small fixes 2) and 013 (`pnpm reset-password`).
- Stopped half way on 2026-11-06 when Gemini ran out of its limit, work uncommitted in the worktrees: Gemini 028 (dark themes, 14 files changed) and Gemini 029 (orders on phones, Android started, iOS not).

## Ready to start (a handoff is written)
| What | Handoff | Notes |
|---|---|---|
| Uzbek text for offline sync | `docs/handoffs/gemini/013` | Old, small. |
| Exact Samsung colors and memory from GSMArena | `docs/handoffs/gemini/016` | The site blocked this computer once; try again slowly. |
| Dark themes seen on every page, fixed and switched on | `docs/handoffs/gemini/028-dark-themes.md` | Open since OpenCode 011 was merged (2026-11-06). Needs eyes: Gemini. |
| Online orders on the phone apps (list, details, status buttons) | `docs/handoffs/gemini/029-mobile-storefront-orders.md` | Written 2026-11-06. |

## Agreed, handoff not written yet
| What | Depends on | Notes |
|---|---|---|
| "Factory reset" in the danger zone (back to the setup wizard) | nothing: the wizard is merged | Not asked for yet. |
| Uzbek for all the English text added by step 11 on the website (handoffs 003 to 009), and a native check of the Uzbek written by Opus 4.8 for backups and the danger zone | nothing: step 11 on the website is merged | For Gemini, one pass. |
| Step 11 on the phone apps (bonus points, printing, buy-back) | step 11 website done | Android and iOS. |
| A real-phone try of branches on both apps; iOS was never seen on a screen (simulator did not answer on 2026-11-06) | nothing | Claude or the user. |
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
