# dev_panel slice

A hidden developer panel for switching the backend environment at runtime.

## Exposes
- `devPanelRoutes` (`/dev`) — a PUBLIC route wired directly in
  `app/router/router.dart` (not `feature_registry.dart`): no nav entry, mounts
  outside the authenticated shell, reachable signed-out from the login screen.
- `DevPanelScreen` — access-code gate (`153535`), then an environment switch
  (production/development) and an editable API base URL per environment.

## Where the config lives
- `core/dev_config.dart` owns the model + providers (foundational: `dioProvider`
  depends on it, so it sits in `core/`, not here). `apiBaseUrlProvider` is the
  live base URL; changing it rebuilds dio with no restart. Persisted in secure
  storage, loaded once in `main()`.

## Must never
- Be treated as a security boundary — the access code is a client-side gate to
  keep the panel out of casual reach, nothing more.
