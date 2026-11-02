# feature: manage-stock-alert-rule

Low-stock monitoring and the rules that drive it.

## Owns
- `StockAlertPanel` — low-stock cards (count vs threshold, red when below) + rules
  table + create/edit dialog.
- `StockAlertRuleDialog` / `StockAlertRuleFields` — shadcn `Form`; model is fixed
  on edit (PATCH only accepts storage/threshold).
- `stock-alert-form.schema.ts` — zod schema; threshold coerced to int >= 1.

## Public API
- `StockAlertPanel` ({ canManage }).

## Uses
- `entities/stock-alert`: `useStockAlertRules`, `useLowStock`,
  `useCreateStockAlertRule`, `useUpdateStockAlertRule`.
- `entities/device-model`: `useDeviceModels` (name lookup).
- `entities/device`: `STORAGE_OPTIONS`.

## Must never
- Call HTTP directly or import another feature.

## Gating
- Viewing is for `device.read`; writes require `settings.manage` (`canManage`).
