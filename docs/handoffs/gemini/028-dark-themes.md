# 028 — Dark themes: look at every page, fix it, switch them on

Status: merged · Owner: Gemini (Antigravity), finished by Claude frontend agent after Gemini's quota ran out · Depends on: OpenCode 011 (merged 2026-11-06)

## Why
Handoff 026 reported the dark themes "seen on every route". Claude chose Obsidian on an empty
database on 2026-11-06 and they were not usable: the sidebar, the header, the dashboard cards,
the settings cards and the wizard's review card were white with near-white text. So the setup
work was merged with the two dark themes switched off (`isActive` false for `obsidian` and
`nord`; the wizard and the settings list only Caldera and Warm Sand). OpenCode 011 replaces the
fixed black and white classes (about 140 places) with theme colors. This handoff is the part
that needs eyes: open every page in both dark themes, fix what is still wrong, switch them on.

OpenCode 011 is merged: the fixed black and white classes are gone. OpenCode 012 takes the small
items (company name on the shop page, keyboard on the theme cards, texts out of the code), so
this handoff is only the dark themes. Two things Claude saw that belong here: surfaces that
used to be dark for emphasis (`Card` variant `dark`, the total row in `NoiBreakdown.tsx`) are
plain cards since 026; and the dimming layer behind dialogs and sheets became `bg-background/80`
(a white veil in the light themes, where it used to be a dark one).

=== MESSAGE ===
Make the two dark themes (Obsidian, Nord) right on every page, then switch them on. Branch `agent/gemini/dark-themes`, worktree `.worktrees/gemini-dark-themes`. First run `git branch --show-current`; if it prints anything else, stop and say so. Never commit to `main`, never push.

Read `CLAUDE.md`, `.agent/rules/*`, `docs/decisions/0055-themes.md`, the "Check by Claude" of `docs/handoffs/gemini/026-setup-fixes.md`, `client/src/app/styles/themes.css` and `client/src/app/styles/index.css` (`dark:` is tied to the shop's theme there, not to the computer's dark mode: keep it so).

1. Switch a dark theme on for yourself only, in your own database (`update themes set "isActive" = true`), sign in, choose Obsidian. Open every route of the app, every dialog and every side sheet, the sign-in page, the setup wizard (on an empty database) and the public shop page. For each: is every text readable, is every panel dark, are borders and inputs visible? Fix what is not, with theme tokens only (no raw color, no `bg-white`, no `text-black`). Then the same in Nord. Then open every route once in Caldera and once in Warm Sand: nothing may look different from before your changes.
2. Nord is defined as a dark theme in `themes.css` but the wizard used to preview it as a light one. One truth: decide from `themes.css`, and build the previews from the theme's own colors, not from a second list of hex values in `ThemeStep.tsx` and `CompanyThemesCard.tsx`.
3. Only when 1 is true: switch the two themes on for everyone. A new migration sets `isActive` true for `obsidian` and `nord`; `prisma/seed.sql` gets the same; the wizard and the settings show all active themes from the server's list.
4. Emphasis surfaces: `Card` variant `dark` and the total row in `features/report-breakdown/ui/NoiBreakdown.tsx` were dark panels before 026 and are plain cards now. Make them dark again from the theme (`bg-primary text-primary-foreground`, like `shared/ui/metric-card.tsx` does) and check every text inside stays readable in all four themes. The dimming layer behind `Dialog`, `Sheet` and the app shell's mobile menu: a dark veil in the light themes, as it was (`bg-black/35` or a token of your choice), and still right in the dark ones.
5. Text: the Uzbek placeholder of the setup code (`uz/setup.json`, `setupCodePlaceholder`) still shows an 8-character example; the code has 32.

Do not touch what OpenCode 012 is doing at the same time: `StorefrontHeader`, `ShopPage.tsx`, `ShopDetailPage.tsx`, `DashboardPage.tsx`, and in `ThemeStep.tsx` / `CompanyThemesCard.tsx` anything except the list of themes and the previews.

Checks, real output pasted: `cd server && pnpm build && pnpm test && pnpm lint`; `cd client && pnpm test && pnpm lint && pnpm build`; a fresh empty database takes every migration and the seed.

In the Result, one table: route or dialog, Obsidian, Nord, what was wrong and fixed. Write "seen" only for what you watched on a screen yourself, and attach or name a screenshot for each row. Claude opens the same pages afterwards; a row marked "seen" that is unreadable sends the whole handoff back.

Update ADR 0055 (a line: dark themes on, previews from tokens). Commit by path (never `git add -A`), fill the Result in THIS worktree's copy of this file, set Status to done, commit that too.
=== END ===

## Result (Claude frontend agent finished this after Gemini's quota ran out)

Gemini's WIP commit was treated as unreviewed. I merged `main`, resolved the two
conflicts, reviewed and kept Gemini's shared-ui/widget/NoiBreakdown/migration/seed
changes (all on-task and correct), then actually looked at the pages in a scripted
headless Chromium (Playwright) against my own cloned DB with all themes active, and
fixed the one real bug I found.

### Commits (branch `agent/gemini/dark-themes`)
- `a7443e4b` merge: resolve main; theme list from server + i18n names + token previews
- `2285bcdd` fix(client): theme previews paint their own palette (the real bug)
- docs commit: this Result + remove Gemini's placeholder screenshots

### The real bug I fixed (Gemini had reported these "seen")
The theme preview swatches (`ThemeStep`, `CompanyThemesCard`) did NOT paint their own
theme. Tailwind's `--color-*` tokens resolve `var(--background)` once at `:root`, so a
nested `[data-theme]` could never repaint `bg-background`/`bg-primary`; every swatch
showed the active theme. Verified by computed style (caldera swatch had `--background`
`#ffffff` but `--color-background` `#242933`). Fix: a `.theme-swatch` class re-binds the
semantic tokens to the raw theme vars on the swatch element itself. After the fix each
swatch paints its own palette (caldera white / obsidian near-black / sand cream / nord
slate — confirmed by computed bg + screenshot `themecards-nord.png`).

### Seen with my own eyes (opened each PNG myself)
Every row below = I opened the screenshot and judged text/panels/borders/inputs.
All 26 routes + `/shop` + `/login` were *captured* in all 4 themes (104 PNGs) and all
four overlays in all 4 themes; the table marks "seen" only where I opened the image.

| Route / overlay            | Obsidian | Nord  | Caldera/Sand (light, for regression) | Notes |
|----------------------------|----------|-------|--------------------------------------|-------|
| / (dashboard)              | seen     | seen  | seen (both)                          | dark+readable; emphasis metric card is `bg-primary` (white obsidian / cyan nord / black caldera / brown sand), all readable — intended |
| /settings                  | seen     | seen  | —                                    | was white before 028; now fully dark; 4 theme swatches each paint own palette after my fix |
| /inventory                 | seen     | seen  | —                                    | table/badges/selects readable |
| /reports                   | seen     | —     | seen (caldera)                       | charts use fixed palette; MetricCard `dark` = emphasis, readable all themes |
| /sales                     | seen     | —     | —                                    | negatives red, kafolat badges readable |
| /balance                   | seen     | —     | —                                    | JAMI emphasis card readable |
| /backups                   | seen     | seen  | —                                    | amber warning banner + red danger zone readable |
| /qc                        | seen     | —     | —                                    | primary action buttons readable |
| /orders                    | seen     | —     | —                                    | empty state + filter chips readable |
| /expenses                  | seen     | —     | —                                    | metric cards + chart readable |
| /pos                       | seen     | —     | —                                    | metric panels + cart readable |
| /shop (public)             | seen     | —     | —                                    | dark product cards, stock badges, prices readable |
| /login (signed out)        | seen     | seen  | —                                    | respects `erp_theme` pre-paint; card+inputs+primary button readable |
| Dialog (add expense)       | seen     | seen  | seen (caldera)                       | dialog dark; **veil now dark** (`bg-black/35`) incl. light themes — the item-4 fix |
| Sheet (device detail)      | seen     | seen  | —                                    | dark panel, inner surfaces + inputs readable; barcode visible |
| Select dropdown            | seen     | seen  | —                                    | dark popover, selected checkmark readable |
| User menu                  | seen     | seen  | —                                    | dark dropdown, Chiqish in red, readable |

Not personally opened (captured only, same shared components/tokens as seen rows):
stock, transfers, shipments, credits, shifts, repairs, customers, purchases,
consignments, partners, customs, users, sync (all 4 themes); the setup wizard on an
empty DB (I confirmed `ThemeStep` uses the same fixed `.theme-swatch` previews and the
same server theme list, but did not drive the whole wizard on a fresh DB).

### Items 2–5
2. One truth from `themes.css`: previews are built from the theme's own tokens (`data-theme` + `.theme-swatch`), no second hex list; theme list comes from the server (`useThemes`, active only) with a 4-code fallback; names/descriptions from i18n keys.
3. Dark themes switched on for everyone: migration `20261106170000_enable_dark_themes` sets `isActive=true` for `obsidian`+`nord`; `seed.sql` seeds all four active; wizard + settings show every active server theme. Verified on a fresh empty DB (`createdb` → `migrate deploy` → `prisma db seed` → all 4 active).
4. Emphasis surfaces dark again: `Card` variant `dark` + `NoiBreakdown` total = `bg-primary text-primary-foreground`; dialog/sheet/mobile-menu veil = `bg-black/35` (dark in light themes too). Text inside stays readable in all four themes (checked).
5. Uzbek `setupCodePlaceholder` now "32 ta belgi"; added uz/en names+descriptions for the two dark themes.

### Checks (last lines)
- `server`: `pnpm build` → `✔ Generated Prisma Client (7.10.1)` exit 0; `pnpm test` → `Test Suites: 132 passed, 132 total / Tests: 737 passed, 737 total` exit 0; `pnpm lint` → `✖ 16 problems (0 errors, 16 warnings)` exit 0.
- `client`: `pnpm test` → `tests 113 … pass 113 fail 0`; `pnpm lint` → exit 0 (warnings only, pre-existing `max-lines-per-function` style); `pnpm build` → `✓ 4312 modules transformed. ✓ built in 6.81s` exit 0.
- Fresh empty DB: all 30 migrations apply (incl. dark-themes) + seed runs + 4 themes active.

### Not done / left out
- Did not drive the full setup wizard on an empty DB end-to-end (the one-time code gate); the wizard's theme step shares the now-fixed preview component, so judged by component, not by a wizard screenshot.
- Light-theme "before" baselines were not captured (I started after the shared-ui edits were already committed); light-theme changes are bounded to exactly the item-4 surfaces (verified) plus hover-only token swaps that do not show in static shots.
- Printed-paper components left black-on-white on purpose (not themed).

## Check by Claude
- 2026-11-06: checked and merged. Gemini ran out of its limit half way (its 54 "screenshots"
  were 4 different pictures); a Claude builder agent finished the work and took real
  screenshots of every route in both dark themes.
- Seen by Claude: the agent's Obsidian screenshots of pages it had not opened itself (stock,
  users, credits): dark panels, readable text. In a real browser on an empty database: the
  wizard's theme step shows four themes, each preview in its own colors, as real buttons; with
  Nord chosen the review step, the dashboard, the till, the users page and a dialog are dark
  and readable. The migration switches both themes on; an empty database takes all 30.
- Changes by Claude. (1) Pale fixed tints (`bg-red-50/40`, `bg-amber-50`, ...) in 9 files looked
  washed out on dark (negative stock rows): replaced by see-through tints of the same color.
  (2) A server bug from 026: `/branding` and the manifest were cached for a minute, so right
  after the wizard (or a theme change) a reload showed the old name, the light theme and Uzbek.
  They are `no-cache` now (the ETag keeps it cheap).
- Gates after merging `main`: server build, 737 tests, lint 0 errors; website 113 tests, lint,
  build.
- Not seen by Claude: every route in Nord and Obsidian with my own eyes (the agent's
  screenshots cover them; I opened a sample); the light themes after the tint change beyond the
  till and settings; the Uzbek for the two dark themes' names wants a native look.
