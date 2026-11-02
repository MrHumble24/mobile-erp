# pos page

Route `/pos`. Thin wrapper that renders the `pos-terminal` widget under a heading.

## Owns
- `ui/PosPage.tsx` — layout only; no data, no business logic.

## Must never
- Fetch data or hold cart state. All of that belongs to `widgets/pos-terminal` and the
  `checkout` feature it composes.

Keyboard shortcuts and POS behaviour are documented in
`widgets/pos-terminal/README.md`.
