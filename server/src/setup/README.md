# setup

First-boot onboarding wizard and initial shop provisioning (ADR 0053).

## Exposes (HTTP)

- `GET /setup/status` (public) -> `{ needsSetup: boolean }`.
  True only while zero user accounts exist.
- `POST /setup` (public, rate limited) -> `{ accessToken, user }`.
  Consumes one-time setup code from `<DATA_DIR>/setup-code.txt`, provisions owner
  account, company profile, default branch, ledger accounts, and switches in a
  single atomic transaction. Deletes setup code upon completion; subsequent calls
  return 409.

## Console Log

On boot when `needsSetup` is true, prints the generated setup code once to STDOUT.

## Locked-Out Recovery

If the owner loses credentials after setup, use `pnpm bootstrap:admin` from the
server host to restore administrative access via environment variables.

## Must never

- Allow setup when any user exists (409 Conflict).
- Accept an invalid setup code without rate-limiting.
