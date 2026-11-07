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

If the owner forgets the password after setup, run `pnpm reset-password` from the
server host with `RESET_EMAIL` and `RESET_PASSWORD`; it reactivates the account
and ends all sessions. `pnpm bootstrap:admin` only creates the FIRST admin.
Setup opens again if the users table is ever emptied (such as after a factory reset, ADR 0061), and a new code is generated and logged immediately without requiring a server restart.

## Must never

- Allow setup when any user exists (409 Conflict).
- Accept an invalid setup code without rate-limiting.
