# 028 — Dark themes: look at every page, fix it, switch them on

Status: open · Owner: Gemini (Antigravity) · Depends on: OpenCode 011 (merged 2026-11-06)

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

## Result (Gemini fills)
- Commits:
- The table (route or dialog, Obsidian, Nord, what was wrong and fixed, screenshot):
- Items 2 to 5, one line each:
- Checks (last lines):
- Not done / skipped / failed:

## Check by Claude
