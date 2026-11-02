# stock_alerts slice

Low-stock view and stock-alert rules. Online reads (`device.read`); rule
writes need `settings.manage`.

## Exposes (`stock_alerts_module.dart`)
- `StockAlertsTab` — the Alerts tab (low-stock list + rules table + create/edit).
- `lowStockProvider`, `stockAlertRulesProvider`, `LowStockView`,
  `StockAlertRuleView`.
- `stockAlertsRoutes` / `stockAlertsNavItems` — both empty (tab-only, no route).

## Must never
- Own a route or nav entry: it is composed inside the inventory page.
- Model names are resolved via `device_models`' `deviceModelsProvider`.
