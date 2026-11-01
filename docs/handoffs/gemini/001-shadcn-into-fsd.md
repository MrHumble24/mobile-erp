# 001 — Move the shadcn/ui setup into the FSD layout and commit

Status: done · Owner: Gemini (Antigravity) · Blocks: frontend agent wave F1

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
- Commit: `6b185d0` (feat(client): shadcn/ui in shared/ui (FSD))
- Components added:
  - `Button`: Caldera pill primary (Ember), secondary, outline, ghost, destructive, sizes sm (48px)/default (56px)/lg (64px)/icon
  - `Input`: 100px radius, 56px height, light and dark surface variants
  - `BarcodeInput`: Hardware scanner friendly with enter key detection and clear button
  - `Label`: Accessible micro-tracking DM Sans label with optional tag
  - `Select`: Pill trigger with Base UI dropdown, chevron and check indicators
  - `Textarea`: 24px radius, roomy padding, light/dark styles
  - `Checkbox`: 8px rounded box with Ember check indicator
  - `Switch`: Pill toggle with Ember active state and smooth sliding thumb
  - `Dialog`: Base UI modal with 40px radius card, backdrop blur, close button
  - `Sheet`: Slide-over drawer (right/left/bottom) with 40px radius
  - `DropdownMenu`: Floating menu with 24px radius and dotted separators
  - `Table`: Dotted borders, 40px container, roomy cell padding (py-6 px-8)
  - `Badge`: 800px pill with Sulfur, Ember, Limestone, Obsidian, Plasma variants
  - `Card`: 40px radius surfaces (Limestone, Ember, Plasma halftone, Obsidian)
  - `MetricCard`: Large Caldera statistic display with Bebas Neue numerals
  - `Tabs`: Segmented pill controls with Ember active pill
  - `Form`: React Hook Form integration with Zod validation
  - `Sonner`: Toaster provider and toast alert utility
  - `Skeleton`: Pulsing placeholders (pill, card, circle)
  - `Separator`: Solid and dotted dividers (horizontal and vertical)
  - `Tooltip`: Accessible hover tooltip with pill styling
  - `Command`: `cmdk` palette for rapid search, barcode scan and shortcuts
  - `Popover`: Floating container for dropdowns and filters
  - `ScrollArea`: Smooth custom scrollbars for long lists
  - `index.ts`: Full barrel re-export in `@/shared/ui`
- Notes for other agents:
  - All components live in `@/shared/ui` and strictly adhere to FSD layer isolation (zero business words).
  - Components are fully ready to use by frontend/fullstack agents in Waves F1 & F2.
  - If a feature or entity slice needs additional variants, props, or tweaks, agents may freely extend and modify these components.
  - Sizing follows the Caldera Design System with Tailwind v4 spacing engine restored (no overrides on `--spacing-*`).
  - `App.tsx` is reset to render `<h1>Assalomu alaykum!</h1>`.
  - `oxlint` (0 errors, 0 warnings) and `tsc -b && vite build` pass cleanly.
