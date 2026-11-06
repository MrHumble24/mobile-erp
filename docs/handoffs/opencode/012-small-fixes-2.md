# 012 — Small fixes: the shop's own name everywhere, wizard theme cards, dashboard text

Status: open · Owner: OpenCode (Big Pickle) · Depends on: nothing

## Why
Found by Claude while checking the setup wizard and the shop page on 2026-11-06. The app is
sold to other shops now, so nothing may say "Malika" by default, and the wizard must work
without a mouse.
- The public shop page writes "Malika Store" in three places and shows the first branch's name
  in its header. The company's name and logo exist since handoff 026 (`GET /company/branding`,
  public, hook `useBranding` in `entities/company`). The app's own header already uses it.
- The wizard's theme cards are plain cards with a click handler: a keyboard cannot reach them.
  The same in the settings' theme card.
- The wizard's theme step has English written in the code ("Text preview", "Action", the theme
  names and descriptions). The dashboard's subtitle is an Uzbek sentence written in the code, so
  it is Uzbek even when English is chosen.

=== MESSAGE ===
Four small fixes on the website. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/small-fixes-2`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, one component per file, files ≤300 lines, shadcn components from `shared/ui`, no native `<button>` or `<input>` outside `shared/ui`, no new dependency, no raw colors, no `bg-white`, no `text-black`). Then read: `client/src/entities/company/` (all of it), `client/src/widgets/app-shell/ui/AppShellHeader.tsx` and `Sidebar.tsx` (how the app shows the company's name and logo), `client/src/widgets/storefront-header/`, `client/src/pages/shop/`, `client/src/pages/shop-detail/`, `client/src/pages/setup/ui/steps/ThemeStep.tsx`, `client/src/pages/settings/ui/company/CompanyThemesCard.tsx`, `client/src/pages/dashboard/ui/DashboardPage.tsx`.

1. The shop's name on the public shop page.
   - `StorefrontHeader` shows the company's name and, when there is one, its logo, from `useBranding()`. Show the logo the same way the app's sidebar does; do not invent a second way. While the name is not loaded or is empty, show nothing in its place: no default name.
   - Remove the default `"Malika Store"` from `StorefrontHeader`'s props, and the two "Malika Store" texts in `ShopPage.tsx` and `ShopDetailPage.tsx`: they show the same company name.
   - After this, `grep -rn "Malika" client/src --include='*.tsx' --include='*.ts'` must print nothing outside `*.spec.ts` files. If it prints something else, fix that too and list it.
   - The browser tab's title on the shop pages: leave as it is.

2. Theme cards a keyboard can use, in `ThemeStep.tsx` and `CompanyThemesCard.tsx`.
   - Each theme is one real control: reachable with Tab, chosen with Enter or Space, and it tells a screen reader which one is chosen (`aria-pressed` on a `Button`, or a radio group if `shared/ui` already has one; do not add a new shadcn component). The look stays the same as today.
   - A visible focus ring, from the existing `Button` styles or `focus-visible:ring-2 ring-ring`.

3. Text out of the code, in `ThemeStep.tsx`: the words "Text preview" and "Action", and each theme's name and description, come from `client/src/shared/i18n/en/setup.json` (new keys, for example `themePreviewText`, `themePreviewAction`, `themes.caldera.name`, `themes.caldera.desc`, `themes.sand.name`, `themes.sand.desc`). Put the same English into `uz/setup.json`. Do not write Uzbek. `CompanyThemesCard.tsx` keeps showing the names the server sends.

4. The dashboard's subtitle (`DashboardPage.tsx`, the `description` of the page header): move it to `client/src/shared/i18n`. The Uzbek sentence that is in the code today goes, unchanged, into `uz/dashboard.json`; write its English meaning into `en/dashboard.json` ("Today's sales figures, income and stock levels"). Use a new key; check the file first for one that already says this.

Do not touch: the list of themes (only Caldera and Warm Sand are offered; the dark ones stay off), `client/src/app/styles/**`, the printed papers, `server/**`.

Tests: this repo tests pure functions only (`node:test`); nothing here is one, so no new test. `pnpm test` must still pass, the theme guard included.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
grep -rn "Malika" src --include='*.tsx' --include='*.ts' | grep -v "spec.ts" | wc -l
```
The last command must print 0. Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Update `client/src/widgets/storefront-header/README.md` (create it if the slice has more than two files and none exists) and `client/src/pages/setup/README.md` in a line each. Commit on this branch, adding files by path (never `git add -A`): the code, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/012-small-fixes-2.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that no screen was seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Items 1 to 4, one line each (files changed):
- Which control was used for the theme cards, and why:
- `pnpm test`, `pnpm lint`, `pnpm build`, the grep (last lines):
- Not done / skipped / failed:

## Check by Claude
