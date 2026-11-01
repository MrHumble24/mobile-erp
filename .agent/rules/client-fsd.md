## client/ — Feature-Sliced Design (mandatory)

Everything under `client/src` lives in exactly one layer:

```
app/        providers, router, global styles, entry       (no business logic)
pages/      one folder per route; composes widgets        (thin)
widgets/    self-contained UI blocks composing features   (e.g. pos-terminal, device-table)
features/   one user action each                          (e.g. checkout, scan-imei, grade-device)
entities/   business objects: model + api + base ui       (e.g. device, sale, partner, customer)
shared/     stack-level code with zero business meaning   (ui kit, api client, lib, config)
```

**Import rule (the whole point):** a layer imports only from layers **below** it.
`app → pages → widgets → features → entities → shared`.
Same-layer imports are forbidden (`features/checkout` must not import `features/scan-imei`); compose them one layer up.

**Slice anatomy** — every slice in `pages/ widgets/ features/ entities/`:
```
<slice>/
  index.ts     public API: the ONLY file other slices may import from
  ui/          components (.tsx) — render and dispatch, nothing else
  model/       state, hooks, selectors, business rules
  api/         request functions + DTO ↔ domain mapping
  lib/         slice-local pure helpers
  README.md    when the slice has > 2 files (see documentation.md)
```
- Deep imports (`entities/device/ui/DeviceCard`) are forbidden. Always `entities/device`.
- `shared/` contains **no** slices and **no** business words: if a file knows what a "device" or "sale" is, it is not shared.
- `App.tsx`/`main.tsx` are `app/` concerns; they do not hold features.
- One component per file; file name = component name.
