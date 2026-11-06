# Backlog

Work that is agreed but not started. One line each; the detail is in the file it points to.
Updated by Claude when something is added, started or finished. Last update: 2026-11-06.

## In progress now (not backlog, listed so nothing is counted twice)
- Step 11 on the website, in parts through OpenCode: parts 1 to 5 merged; price tags is next (`docs/handoffs/opencode/008`).
- Online storefront, server and website: `docs/handoffs/gemini/022`. Gemini reports it done (branch `agent/gemini/storefront`); waiting for Claude's check.
- First-boot setup, in-app configuration, branding and themes: `docs/handoffs/gemini/024`. Given to Gemini by the user; Gemini reports it done (branch `agent/gemini/setup`); waiting for Claude's check. It built its own secrets store at the same time as the backup work did; the two must be joined into one before both are merged.
- Backup and restore: `docs/handoffs/gemini/023-backup-and-restore.md`. Started 2026-11-06 with Opus 4.8, Claude orchestrating. Parts 1 and 2 (backup on the server, restore) are built and tested by Claude on a throwaway database; a security check is running and one round of fixes follows. Then Telegram, Google Drive and OneDrive, then the website screen.

## Ready to start (a handoff is written)
| What | Handoff | Notes |
|---|---|---|
| Uzbek text for offline sync | `docs/handoffs/gemini/013` | Old, small. |
| Exact Samsung colors and memory from GSMArena | `docs/handoffs/gemini/016` | The site blocked this computer once; try again slowly. |

## Agreed, handoff not written yet
| What | Depends on | Notes |
|---|---|---|
| Step 11 website: buy-back messages and the ADR for the step (part 7) | part 6 merged | OpenCode 009. |
| Uzbek for all the English text added by step 11 on the website | part 7 merged | For Gemini, one pass. |
| Branches on the phone apps (store picker, the store sent with every request) | nothing | Until then a user of two stores gets an error on the phones. |
| Step 11 on the phone apps (bonus points, printing, buy-back) | step 11 website done | Android and iOS. |
| Storefront orders on the phone apps | handoff 022 merged | Read the list, change the status. |
| Mobile Uzbek strings | nothing | Gemini 014, reserved, never written. |
| The till at phone width with very large amounts; every dialog | nothing | Left unchecked after the money overflow fix (`docs/handoffs/opus48/001`). |

## Waiting on someone else
| What | Waiting on |
|---|---|
| Customs fee Excel upload | The client's real Excel file (asked 2026-11-04). |
| PRD text for the 15 changes, branches and backup providers | The user pastes it into `docs/PRD.md`; Claude writes the text on request. |
| Pushing to Railway (198+ commits are local only) | The user. After a push: run the seed, `pnpm ref:import`, and give uploads a volume. |

## Later, only when asked
- Tax receipts (Change 15).
- Storefront second version: online payment, reservation, delivery, customer login.
- S3-style storage as one more backup provider.
- Deleting the dead worktree and branch `agent/opencode/branches-server`.
