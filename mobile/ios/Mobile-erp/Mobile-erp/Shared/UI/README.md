# Shared/UI — the Warm Card kit

Stack-level UI with zero business meaning, built from `Theme/` tokens
(DESIGN.md, ADR 0022). Features compose these; they never re-roll a control or
reach for a stock style. The one place a raw `TextField`/`Menu`/`.sheet` may be
dressed.

## Primitives
- **PillButton** (`ButtonStyle`) — `.pillPrimary` (the one orange),
  `.pillSecondary` (surface2), `.pillGhost` (clear), `.pillDestructive`
  (danger). 52 pt, radius 14; press = scale 0.98 + darker fill (120 ms);
  disabled loses the orange. Width is the caller's.
- **AppTextField** — 52 pt, radius 12, white fill, 1 pt border → 2 pt `action`
  ring on focus. `font:` overrides for mono data entry.
- **AppFormField** — a muted keyed label over any field view.
- **AppSelect** — a `Menu` dressed as a field, with a chevron.
- **SegmentedControl** — custom track (surface2) with the selected segment on a
  white pill; replaces `.pickerStyle(.segmented)`.
- **FilterSheet** — title + scrollable content + reset/close `PillButton`s;
  rises with the shared sheet chrome. Copy is the caller's (no keys here).
- **AppBottomSheet** — `.appBottomSheet()` (presentation chrome: medium/large
  detents, no drag indicator, `card` background, radius 20) and the
  `.appSheet(isPresented:)` / `.appSheet(item:)` helpers that wrap `.sheet`.
- **OfflineBanner** — a quiet surface2 strip; never orange.
- **AppCard** — white card, radius 16, 20 pt padding, no border/shadow. (The
  `borderColor` param is kept for not-yet-migrated call sites and is ignored.)
- **StatusBadge** — 12/600 pill in a status hue + its tint; device-status
  codes map `IN_STOCK→success`, `DEFECTIVE→danger`, `CONSIGNED→info`,
  `SOLD→sold`.
- **SummaryTile / SummaryTileGrid** — stat tile on a card, value in mono.
- **TabChips / TabChipItem** — tabs as a scrolling chip row (optional mono count
  and hue per chip) where a fixed `SegmentedControl` would truncate three or more
  labels. Promoted from the consignment slice when the users screen needed it.
- **AppDateField** — a `DatePicker` in the kit field chrome (card fill, hairline,
  52 pt). Promoted from the consignment slice when the expense forms needed it.
- **SheetTitleRow / SubjectBlock / FormErrorLine** (`SheetChrome.swift`) — the
  write-sheet chrome: title + 44 pt close circle, the surface-2 subject block, the
  inline error / offline line. Promoted from the consignment slice when customers
  needed the same chrome.
- **FactRow** — keyed fact row for detail sheets (caption label left, value
  right, hairline unless `last`); promoted from the inventory slice when the
  consignment slice needed the same row.
- **MetricRow / MetricList** (`MetricRow.onTap` makes a row a drill-down with a chevron) — the compact KPI list-card (muted label + caption
  left, mono figure right, hairline dividers), the Android `MetricGrid` phone
  layout; used by the dashboard KPIs and the sales summary.
- **MoneyTint** (`moneyTint(_:_:)`) — the one rule for tinting a financial
  figure by meaning + sign: profit green when ≥ 0 / red when negative, revenue
  `text`, expenses red. Used by the dashboard and reports tiles.
- **ScannerField**, **AppSwitchStyle** (`action` tint), **StateViews** (spinner
  and glyphs in muted, never action), **KitToast** (token tints, radius 14).

## Dates (`Shared/Kit/KitDate.swift`)
- **KitDate** — `parse` (ISO-8601 with or without fractions), `day`
  (`yyyy-MM-dd`), `dayTime` (`yyyy-MM-dd HH:mm`, local). Sales and inventory
  both read it.

## Motion & haptics (`Shared/Kit/`)
- **Haptic** (`Haptics.swift`) — the vocabulary: `tick` (captured scan),
  `success` (completed sale / submitted batch), `error` (duplicate or rejected
  scan). Declarative `.haptic(trigger:kind:)` (iOS 17 `.sensoryFeedback`) at
  semantic moments; `Haptic.<kind>.play()` imperatively at button-tap sites. No
  screen builds its own generator.
- **CaptureSpring** (`CaptureSpring.swift`) — the signature motion, the only
  authored animation in the app. `.captureSpringRow()` on each row springs the
  new unit in from the scan field; `.captureSpringList(value:count:)` on the
  container drives the spring and dims the rest for one beat. Reduce Motion →
  150 ms fade, no dim. Applied on the POS cart and the intake staged list.

## Must never
- Hold business state, know what a "device" or "sale" is, or import a feature.
- Use raw hex, `.secondary`/`.primary`, or a stock control style outside here.
