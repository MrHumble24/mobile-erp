# pos-terminal

The cashier's POS workspace. Composes the `checkout` and `consign-device` features
(which never import each other) with the device, sale, customer, settings and auth slices.

## Owns
- `model/use-pos-terminal.ts` — orchestrator: mode (Sale | Nasiya), settings, cost
  permission, cart wiring, checkout + receipt state, Nasiya consign target.
- `model/use-pos-scanner.ts` — resolves scans through `useDeviceByImei`; IN_STOCK is
  dispatched (add line, or open consign in Nasiya), other statuses become a `ScanResult`
  card. `focusScanner()` + `SCANNER_INPUT_ID` for F2.
- `model/use-pos-shortcuts.ts` — global keys.
- UI: `PosTerminal`, `ModeSwitch`, `PosScanner`, `ScanResultCard`, `SessionPanel`,
  `NasiyaPanel`, `ShortcutsHelp`.

## Keyboard shortcuts
`F2` focus scanner · `F9` checkout · `Esc` clear scanner · `Ctrl/⌘+Backspace` remove
last line · `F4` customer search · `F8` switch Sale/Nasiya.

## Must never
- Put business rules in `ui/` — those live in the features/entities it composes.
- Let features reach each other; the widget is the only composition point.

## Open questions
- SOLD scan links to `/sales` (list), not the exact sale — device lookup has no sale id.
- Session revenue sums the first 100 sales of the day only.
