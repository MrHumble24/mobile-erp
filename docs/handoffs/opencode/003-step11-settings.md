# 003 — Step 11, part 1 of 6: settings switches for bonus points and printing

Status: done · Owner: OpenCode (Big Pickle) · Depends on: nothing

## Why
Handoff `gemini/020-step11-website.md` is too big for one go, so it is given in parts, one after
another, each checked and merged by Claude before the next starts:
003 settings switches · 004 the customer's points · 005 paying with points at the till ·
006 points on the receipt, the sale and the report · 007 printing · 008 buy-back messages.
This is part 1. The server already stores these settings (ADR 0043); the website cannot change them.

=== MESSAGE ===
Add two sections to the website's Settings page: bonus points and printing. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-settings`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, shadcn components from `shared/ui`, no native form elements, one component per file, files ≤300 lines, no new dependency). Then read `docs/decisions/0043-bonus-points.md`, `server/src/settings/README.md`, `server/src/settings/dto/update-settings.dto.ts` and `server/src/settings/settings.service.ts`, so every field name and type comes from the server and none is guessed.

The six settings (all already saved and returned by `GET /settings` and `PUT /settings`):
- `bonusEnabled` (true/false), `bonusEarnPercent` (0 to 100, up to 2 decimals), `bonusMaxRedeemPercent` (0 to 100, up to 2 decimals). The server returns the two percents as text like `"5.00"`.
- `receiptPrintingEnabled` (true/false), `receiptPaperWidthMm` (58 or 80), `priceTagsEnabled` (true/false).

Do this:
1. `client/src/entities/settings/model/settings.types.ts`: add the six fields to `StoreSettings` and (optional) to `UpdateSettingsDto`.
2. `client/src/pages/settings/model/settings-schema.ts`: add them to the form schema, the default values and the mapping to the request, the same way the discount and credit fields are done there.
3. Two new components, each in its own file in `client/src/pages/settings/ui/`: `BonusSection.tsx` and `PrintingSection.tsx`, shown on the Settings page after the Repairs section.
   - Bonus: a switch, then the two percent inputs. The two inputs are shown only while the switch is on.
   - Printing: a switch for receipts, a paper width choice (58 mm or 80 mm, a `Select` from `shared/ui`) shown only while that switch is on, and a switch for price tags.
4. `SettingsSections.tsx` is already 230 lines and must not grow. The helpers the new sections need (`Field`, `SwitchField`, `Section`) are private in that file: move each into its own file in the same folder and import it from both places. Do not copy them.
5. Text: add the new keys to `client/src/shared/i18n/en/settings.json` and the same keys with the same English text to `client/src/shared/i18n/uz/settings.json`. Do not write Uzbek; it is translated later. No raw key may show on screen.
6. Update `client/src/pages/settings/README.md` in a line or two.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/003-step11-settings.md`, set Status to done, and commit that too. Report only what you ran. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used: Big Pickle (`opencode/big-pickle`)
- Commits: `3f29abf` feat(settings): add bonus points and printing sections. This handoff doc is committed separately.
- Files changed:
  - `client/src/entities/settings/model/settings.types.ts` — the six fields on `StoreSettings` and optional on `UpdateSettingsDto`.
  - `client/src/pages/settings/model/settings-schema.ts` — schema, form defaults and request mapping; `numField` gained an optional 2-decimal check used by the bonus percents.
  - `client/src/pages/settings/model/settings-form.types.ts` — shared form/string-field/boolean-field types.
  - `client/src/pages/settings/ui/Field.tsx`, `SwitchField.tsx`, `Section.tsx` — helpers moved out of `SettingsSections.tsx` (now 118 lines, was 230).
  - `client/src/pages/settings/ui/BonusSection.tsx`, `PrintingSection.tsx` — new sections, rendered immediately after Repairs.
  - `client/src/pages/settings/ui/SettingsPage.tsx` — mounts both new sections.
  - `client/src/shared/i18n/en/settings.json`, `uz/settings.json` — 12 new keys; uz carries the same English text for later translation.
  - `client/src/pages/settings/README.md` — sections list updated.
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
  - `pnpm install`: lockfile up to date, 642 packages, done.
  - `pnpm test`: `ℹ tests 68` · `ℹ pass 68` · `ℹ fail 0`.
  - `pnpm lint`: `$ oxlint` — 0 errors, pre-existing warnings only; the new files produce none.
  - `pnpm build`: `✓ built in 5.80s`; PWA `precache 138 entries`; `files generated`.
  - `graphify update .`: ran in `client/` (789 files, 3234 nodes) and at the repo root (2388 files, 13020 nodes). The root run skipped `graph.html` because the graph exceeds the 5000-node visualization limit; `graph.json` and `GRAPH_REPORT.md` were updated.
- Not done / skipped / failed: Uzbek strings intentionally left in English per the handoff. No check failed; nothing else skipped.

## Check by Claude
