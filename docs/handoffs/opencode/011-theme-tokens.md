# 011 — Fixed colors out of the website, so dark themes can work

Status: open · Owner: OpenCode (Big Pickle) · Depends on: nothing

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
- Model used:
- Commits:
- Counts before and after (each of the four classes):
- The new guard test: failing count before, passing after:
- Files where a `text-white` or `bg-black` was left on purpose, and why:
- `pnpm test`, `pnpm lint`, `pnpm build`, the grep (last lines):
- Not done / skipped / failed:

## Check by Claude
