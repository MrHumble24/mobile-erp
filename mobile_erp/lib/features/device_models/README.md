# device_models slice

Device models and their dynamic spec schema (`AttributeDef`). Online reads
(`device.read`); writes need `device.update`.

## Exposes (`device_models_module.dart`)
- `DeviceModelsTab` — the Models tab (list + create/edit with attributes editor).
- `DynamicSpecFields` — renders spec value inputs from a model's attribute
  schema; reused by the devices slice's edit-device sheet.
- `deviceModelsProvider`, `modelAttributesProvider`, `DeviceModelView`,
  `AttributeDef`.
- `deviceModelsRoutes` / `deviceModelsNavItems` — both empty (tab-only, no route).

## Must never
- Own a route or nav entry: it is composed inside the inventory page.
