# pages/sync

Route `/sync` (permission `sync.resolve`). Two tabs via `useUrlTab`:

- **Queue** — this terminal's outbox from `entities/sync` (IndexedDB mirror):
  pending and rejected rows with type, IMEI, time, error. Rejected rows get
  Retry (re-queue + drain) and Discard.
- **Conflicts** — server `GET /sync/conflicts`; each row resolves keep-server or
  apply-terminal. A 409 on apply-terminal leaves it pending and toasts why.

Composes `entities/sync` hooks only; holds no sync logic of its own.
