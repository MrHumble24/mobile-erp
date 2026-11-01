# 001 — Move the shadcn/ui setup into the FSD layout and commit

Status: open · Owner: Gemini (Antigravity) · Blocks: frontend agent wave F1

## Why
Your shadcn setup landed in `client/src/components/ui`, `client/src/lib`, `client/src/tokens` and a
`components/caldera` folder. The project rule (`.agent/rules/client-fsd.md`, `client-stack.md`) puts the
design system in `client/src/shared/ui` and forbids business components outside FSD slices. The Claude
frontend agent cannot start until this is committed in the right place.

=== MESSAGE ===
Read `.agent/rules/client-fsd.md` and `.agent/rules/client-stack.md` first, then finish the shadcn/ui setup inside the FSD layout in `client/`:

1. Move `src/components/ui/*` → `src/shared/ui/`, `src/lib/utils.ts` → `src/shared/lib/utils.ts`, `src/tokens/*` → `src/shared/config/tokens/`. Update `components.json` aliases to `"ui": "@/shared/ui"`, `"utils": "@/shared/lib/utils"`, `"lib": "@/shared/lib"`, `"components": "@/shared/ui"`, `"hooks": "@/shared/lib/hooks"`. Make sure the `@/` alias exists in `vite.config.ts` and `tsconfig.app.json`.
2. Add these shadcn components into `src/shared/ui/`: button, input, label, select, textarea, checkbox, switch, dialog, sheet, dropdown-menu, table, badge, card, tabs, form, toast/sonner, skeleton, separator, tooltip, command. Install `react-hook-form`, `@hookform/resolvers`, `zod` (needed by `form`).
3. Delete `src/components/caldera/*` (Hero, Navbar, PlasmaCard, Stats, DarkSection, PosScanner, ConsignmentTable). They are not PRD features and not in an FSD slice. If you want to keep any visual idea, note it in the Result section below instead of keeping code.
4. Keep `src/index.css` as the Tailwind v4 entry with the design tokens as CSS variables; move it to `src/app/styles/index.css` and update `main.tsx`.
5. Reset `App.tsx` to render only `<h1>Assalomu alaykum!</h1>`; the frontend agent will replace it with `app/` providers and router.
6. No file over 300 lines. `pnpm lint` and `pnpm build` must pass (`react/forbid-elements` is on: native `<button>/<input>/…` only inside `src/shared/ui/**`).
7. Commit on `main` with message `feat(client): shadcn/ui in shared/ui (FSD)` adding only the paths you changed. Fill the Result section of `docs/handoffs/gemini/001-shadcn-into-fsd.md` and set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Components added:
- Deviations / notes:
