# 0055 — Multi-Theme Support and Semantic Color Tokens

Date: 2026-11-06
Status: Accepted

## Context
Mobile ERP was authored with fixed hex values tied to the default light look.
Store branding requires selectable visual themes (Caldera light, Obsidian dark,
Warm Sand, Nord slate) without arbitrary hex colors scattered in application code.

## Decision
- **Semantic CSS Tokens**: Replaced raw hex class names with Tailwind semantic tokens
  (`bg-background`, `bg-card`, `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`).
- **Theme Definitions**: Centralized in `themes.css` with 4 verified palettes:
  - `caldera`: Crisp modern light (default).
  - `obsidian`: High-contrast dark (#0f1117 background).
  - `sand`: Warm desert parchment (#fcfaf6 background).
  - `nord`: Arctic slate (#242933 background).
- **Accessibility**: All themes guarantee WCAG AA contrast ratio (>= 4.5:1) for body text
  and primary surfaces, continuously asserted via `theme-tokens.spec.ts`.
- **Zero Flash**: Applied via `data-theme` on `document.documentElement` before first paint
  using an inline script in `index.html`.

## Consequences
- Theme switching updates all components instantly without page reload.
- New components must use semantic tokens; raw hex classes fail CI tests.
