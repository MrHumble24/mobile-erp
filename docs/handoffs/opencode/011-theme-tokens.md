# 011 — Fixed colors out of the website, so dark themes can work

Status: merged · Owner: OpenCode (Big Pickle) · Depends on: nothing

## Why
The shop can choose a theme (ADR 0055). Two of the four are dark, and they are switched off,
because the website still paints many panels with a fixed white: with a dark theme the text
turns light and the panel stays white, so nothing can be read. Counted by Claude on 2026-11-06,
outside the printed papers: `bg-white` 108 times, `text-black` 20, `bg-black` 8, `text-white` 8,
in 93 files. This handoff replaces them with the theme's own colors. It is a mechanical job.
Nobody switches the dark themes on here; Gemini does that in `docs/handoffs/gemini/028` after
looking at every page.

=== MESSAGE ===
Replace fixed black and white classes in the website with theme colors. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/theme-tokens`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding. Then read `docs/decisions/0055-themes.md`, `client/src/app/styles/themes.css` (the colors each theme defines) and `client/src/shared/lib/theme-tokens.spec.ts` (the guard test).

Never touch these four files, they are printed paper and stay black on white on purpose: `ReceiptPaper.tsx`, `RepairTicketPaper.tsx`, `ContractPaper.tsx`, `PriceTag.tsx`. Also leave `client/src/app/styles/**` alone.

In every other `.tsx` file under `client/src`, apply exactly these rules to Tailwind class names. Change class names only: no layout change, no logic change, no new component.

1. `bg-white` becomes `bg-card`. With an opacity it keeps the opacity: `bg-white/80` becomes `bg-card/80`. Also inside `hover:`, `focus:`, `data-[...]:` and similar prefixes.
2. `text-black` becomes `text-foreground` (opacity kept the same way).
3. `bg-black` with an opacity (`bg-black/40`, `bg-black/50`…) is a dimming layer behind a dialog: leave it.
4. `bg-black` with no opacity becomes `bg-primary`, and a `text-white` on the same element becomes `text-primary-foreground`.
5. `text-white` on an element whose background is `bg-primary` becomes `text-primary-foreground`. `text-white` on a fixed colored background (`bg-destructive`, `bg-emerald-…`, `bg-red-…`, `bg-amber-…`, a picture) stays.
6. `border-white` and `ring-white`, if you meet them, become `border-card` and `ring-card`.
7. If a file now has both `bg-card` and a fixed dark text color from rule 2's family that you did not change, leave it and list the file in the Result.

Then make the guard stricter, in `client/src/shared/lib/theme-tokens.spec.ts`: next to the existing check, add one test that fails when a `.tsx` file outside the same allow list contains the class `bg-white` or `text-black` (word-bounded, with or without a prefix or an opacity). Run it once BEFORE your replacements and paste how many places it reports, then again after: it must pass.

Do not change `isActive` of any theme, the seed, the migration, the wizard's theme list or `CompanyThemesCard.tsx`'s list. The dark themes stay off.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
grep -rnE "\b(bg-white|text-black)\b" src --include='*.tsx' | grep -v "Paper.tsx\|PriceTag.tsx" | wc -l
```
The last command must print 0. Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`; `git add -u client/src` is fine): the code, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/011-theme-tokens.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that no screen was seen; Claude checks the screens in the two light themes. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used: Big Pickle (`opencode/big-pickle`)
- Commits: `c8597d5` — `fix(client): replace fixed black/white classes with theme tokens`; this handoff update is committed separately on the same branch.
- Counts before and after (each of the four classes): `bg-white` 108 → 0; `text-black` 20 → 0; `bg-black` 8 → 7; `text-white` 8 → 6.
- The new guard test: failing count before, passing after: before it failed with **128 findings in 90 files** (108 × `bg-white`, 20 × `text-black`); after the replacements it passes with 0.
- Files where a `text-white` or `bg-black` was left on purpose, and why:
  - `text-white` kept on fixed colored backgrounds (rule 5): `features/manage-storefront-order/ui/OrderStatusActions.tsx` (2, `bg-emerald-600`), `pages/transfers/ui/TransferDetailSheet.tsx` (1, `bg-emerald-600`), `widgets/device-drawer/ui/DeviceDrawer.tsx` (1, `bg-emerald-600`), `widgets/app-shell/ui/Sidebar.tsx` (1, `bg-blue-600` avatar).
  - `text-white` kept in `shared/ui/metric-card.tsx`: the element's background is `bg-card` (not `bg-primary` and not a fixed color), so rule 5 does not apply.
  - `bg-black` with an opacity kept in 7 places (rule 3): `shared/ui/scroll-area.tsx` (2, `hover:bg-black/5`), `shared/ui/button.tsx` (1, `hover:bg-black/[0.04]`), `widgets/app-shell/ui/AppShellHeader.tsx` (1), `widgets/app-shell/ui/UserMenu.tsx` (1), `widgets/app-shell/ui/Sidebar.tsx` (1), all `hover:bg-black/[0.04]`, and `entities/sale/ui/receipt/ChequeWarranty.tsx` (1, `bg-black/[0.02]`).
- `pnpm test`, `pnpm lint`, `pnpm build`, the grep (last lines):
  - `pnpm test`: `ℹ tests 113`, `ℹ pass 113`, `ℹ fail 0`.
  - `pnpm lint`: completed with warnings only (existing `max-lines-per-function` and React compiler warnings), no errors.
  - `pnpm build`: `✓ 4312 modules transformed`, `✓ built in 6.80s`, `PWA v2.0.0 … precache 178 entries`.
  - grep: `0`.
- Not done / skipped / failed: no browser was opened and no screen was seen — Claude still needs to check the screens in the two light themes. Dark themes were not enabled (out of scope / Gemini 028). `graphify update .` ran in `client/` and at the repo root; the root run skipped `graph.html` because the graph exceeded graphify's 5000-node HTML limit. No failures otherwise.

## Check by Claude
- 2026-11-06: checked and merged. The report was accurate. The diff changes class names only
  (checked by turning the new classes back and comparing: no other change outside the guard
  test). After merging `main`: 113 website tests, lint 0 errors, build pass.
- My handoff missed some printed paper: the parts of the receipt (`ChequeHeader`, `ChequeItems`,
  `ChequeWarranty`, `ItemIdentity`) and `PriceTagSheet`. OpenCode recolored them as told. Claude
  put them back to black on white and added them to the guard's allow list.
- Seen in a browser, default theme, real data: dashboard, inventory, till (catalog), sales.
  Nothing looks different from before.
- Found while looking, not from this handoff: the highlighted summary card (expenses on the
  dashboard, net profit on sales) showed no number in the light themes since handoff 026 (white
  number on a white card). Fixed by Claude in `shared/ui/metric-card.tsx`: it is dark again,
  from the theme's primary color.
- Not seen: Warm Sand after this change; any dialog.
