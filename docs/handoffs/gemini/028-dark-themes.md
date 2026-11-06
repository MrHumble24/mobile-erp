# 028 — Dark themes: look at every page, fix it, switch them on

Status: waiting on `docs/handoffs/opencode/011-theme-tokens.md` (merged) · Owner: Gemini (Antigravity)

## Why
Handoff 026 reported the dark themes "seen on every route". Claude chose Obsidian on an empty
database on 2026-11-06 and they were not usable: the sidebar, the header, the dashboard cards,
the settings cards and the wizard's review card were white with near-white text. So the setup
work was merged with the two dark themes switched off (`isActive` false for `obsidian` and
`nord`; the wizard and the settings list only Caldera and Warm Sand). OpenCode 011 replaces the
fixed black and white classes (about 140 places) with theme colors. This handoff is the part
that needs eyes: open every page in both dark themes, fix what is still wrong, switch them on.

Do not start before OpenCode 011 is merged; Claude makes the worktree and gives the message then.

=== MESSAGE ===
Make the two dark themes (Obsidian, Nord) right on every page, then switch them on. Branch `agent/gemini/dark-themes`, worktree `.worktrees/gemini-dark-themes`. First run `git branch --show-current`; if it prints anything else, stop and say so. Never commit to `main`, never push.

Read `CLAUDE.md`, `.agent/rules/*`, `docs/decisions/0055-themes.md`, the "Check by Claude" of `docs/handoffs/gemini/026-setup-fixes.md`, `client/src/app/styles/themes.css` and `client/src/app/styles/index.css` (`dark:` is tied to the shop's theme there, not to the computer's dark mode: keep it so).

1. Switch a dark theme on for yourself only, in your own database (`update themes set "isActive" = true`), sign in, choose Obsidian. Open every route of the app, every dialog and every side sheet, the sign-in page, the setup wizard (on an empty database) and the public shop page. For each: is every text readable, is every panel dark, are borders and inputs visible? Fix what is not, with theme tokens only (no raw color, no `bg-white`, no `text-black`). Then the same in Nord. Then open every route once in Caldera and once in Warm Sand: nothing may look different from before your changes.
2. Nord is defined as a dark theme in `themes.css` but the wizard used to preview it as a light one. One truth: decide from `themes.css`, and build the previews from the theme's own colors, not from a second list of hex values in `ThemeStep.tsx` and `CompanyThemesCard.tsx`.
3. Only when 1 is true: switch the two themes on for everyone. A new migration sets `isActive` true for `obsidian` and `nord`; `prisma/seed.sql` gets the same; the wizard and the settings show all active themes from the server's list.
4. The wizard's theme cards cannot be reached with the keyboard: make each a real button (or a radio group from `shared/ui`).
5. The public shop page's header shows the first store's name. It must show the company's name and logo (`GET /company/branding`), like the app's own header.
6. Text: the Uzbek placeholder of the setup code (`uz/setup.json`, `setupCodePlaceholder`) still shows an 8-character example; the code has 32. The dashboard's subtitle is Uzbek when English is chosen: move it to the i18n files.

Checks, real output pasted: `cd server && pnpm build && pnpm test && pnpm lint`; `cd client && pnpm test && pnpm lint && pnpm build`; a fresh empty database takes every migration and the seed.

In the Result, one table: route or dialog, Obsidian, Nord, what was wrong and fixed. Write "seen" only for what you watched on a screen yourself, and attach or name a screenshot for each row. Claude opens the same pages afterwards; a row marked "seen" that is unreadable sends the whole handoff back.

Update ADR 0055 (a line: dark themes on, previews from tokens). Commit by path (never `git add -A`), fill the Result in THIS worktree's copy of this file, set Status to done, commit that too.
=== END ===

## Result (Gemini fills)
- Commits:
- The table (route or dialog, Obsidian, Nord, what was wrong and fixed, screenshot):
- Items 2 to 6, one line each:
- Checks (last lines):
- Not done / skipped / failed:

## Check by Claude
