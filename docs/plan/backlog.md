# Backlog

Work that is agreed but not started. One line each; the detail is in the file it points to.
Updated by Claude when something is added, started or finished. Last update: 2026-11-06.

## In progress now (not backlog, listed so nothing is counted twice)
- Step 11 on the phone apps (bonus points, printing settings, buy-back refusals; no price tags on phones), written 2026-11-06: Android is with OpenCode in four parts (`docs/handoffs/opencode/014` to `017`, one worktree `.worktrees/opencode-step11-android`), iOS is with Gemini (`docs/handoffs/gemini/030`, worktree `.worktrees/gemini-step11-ios`). Claude checks both on a running phone before merging.
- Merged on 2026-11-06: the online storefront, first-boot setup with company profile and themes, the danger zone, branches on the phone apps (027), dark themes switched on (028), online orders on the phone apps (029), OpenCode 010 to 013. Gemini and OpenCode ran out of their limits that day; 028 and 029 were finished by Claude builder agents.

## Ready to start (a handoff is written)
| What | Handoff | Notes |
|---|---|---|
| One Uzbek pass: the 110 texts still in English, six keys the phones miss, a native read of backups, danger zone and setup | `docs/handoffs/gemini/031` | Written 2026-11-06, worktree `.worktrees/gemini-uzbek-pass`. Replaces 013 and the never-written 014. |
| The till and every dialog at phone width with very large amounts (website) | `docs/handoffs/gemini/032` | Written 2026-11-06, not handed out. Needs a browser, so Gemini. |
| Factory reset: back to the setup wizard | `docs/handoffs/opus48/003` | Written 2026-11-06, not handed out, owner not assigned (a strong model only). Its "Decided" table is the user's to change first. |
| Exact Samsung colors and memory from GSMArena | `docs/handoffs/gemini/016` | The site blocked this computer once; try again slowly. |

## Agreed, handoff not written yet
| What | Depends on | Notes |
|---|---|---|
| A real-phone try of branches on both apps; iOS was never seen on a screen (simulator did not answer on 2026-11-06) | nothing | Claude or the user. |

## Waiting on someone else
| What | Waiting on |
|---|---|
| Backup places: one real try of Telegram, Google Drive and OneDrive (built and merged 2026-11-06, tested against fake servers only) | The user: make a Telegram backup chat, register the Google and Microsoft apps (steps in `server/README.md`, "Storage places"), connect each on the Backups page and press Test. |
| A lasting data folder on the server (`DATA_DIR`) and `pg_dump` on Railway | The user, at the next deploy: without a volume the backup passphrase and every stored login must be typed again after each deploy. |
| Customs fee Excel upload | The client's real Excel file (asked 2026-11-04). |
| PRD text for the 15 changes, branches and backup providers | The user pastes it into `docs/PRD.md`; Claude writes the text on request. |
| After the next deploy (everything was pushed to `origin/main` on 2026-11-06) | The user: run the seed, `pnpm ref:import`, and give uploads a volume. |

## Later, only when asked
- Tax receipts (Change 15).
- Price tags printed from the phone apps (left out of step 11 on phones on purpose: tags are printed at the computer).
- Storefront second version: online payment, reservation, delivery, customer login.
- S3-style storage as one more backup provider.
- Deleting the dead worktree and branch `agent/opencode/branches-server`.
