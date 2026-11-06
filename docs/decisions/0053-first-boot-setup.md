# 0053 — First-boot setup and initial provisioning

Date: 2026-11-06
Status: Accepted

## Context
Deploying the ERP to other shops requires zero developer intervention for the first
owner account, company details, and initial branch setup. A fresh system exposed
on the network must be protected from hostile takeovers while remaining easy to set up.

## Decision
- `GET /setup/status` (public) returns `{ needsSetup }`, true only when zero users exist.
- On first boot with zero users, the server generates a random 8-character setup code,
  stores it in `<DATA_DIR>/setup-code.txt`, and logs it once to the console.
- `POST /setup` (public, throttled) accepts the code and wizard answers. Inside an
  atomic transaction protected by `pg_advisory_xact_lock`, it provisions the owner
  (ADMIN role), company profile, initial store, ledger accounts, and switches.
- Upon completion, the setup code file is unlinked. Subsequent calls return 409 Conflict.
- Failed setup code attempts are rate-limited to 5 per 15-minute window.
- If an owner is ever locked out, `pnpm bootstrap:admin` remains available via server CLI.

## Consequences
- No default credentials or unauthenticated takeover windows exist.
- Single atomic transaction eliminates partial provisioning states.
