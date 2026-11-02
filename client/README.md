# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Offline-first (sync)

The bazaar's internet drops often. The four POS/consignment writes
(`sale.create`, `consignment.create/settle/return`) queue to IndexedDB on a
transport failure or while offline, then drain to `POST /sync/push` once the
connection returns. See ADR `docs/decisions/0018-client-offline-sync.md`.

- Queue + drain engine + conflict reads: `entities/sync` (mounted once in the
  app shell). Pure drain logic + test: `entities/sync/lib/drain.ts` / `.spec.ts`
  (`pnpm test`).
- IndexedDB wrapper, online-status hook, terminal id: `shared/lib/offline`.
- Offline IMEI lookup falls back to the synced device cache in
  `entities/device` (never holds cost fields).
- Status in the app-shell header; manage queue + conflicts at `/sync`
  (permission `sync.resolve`).
- `vite-plugin-pwa` precaches the app shell so a reload offline still boots; it
  never caches `/api` responses.
