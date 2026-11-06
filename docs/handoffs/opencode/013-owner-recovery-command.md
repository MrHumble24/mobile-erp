# 013 — A way back in for a locked-out owner: `pnpm reset-password`

Status: open · Owner: OpenCode (Big Pickle) · Depends on: nothing

## Why
A shop's owner who forgets the password has no way back in. The READMEs and ADR 0053 say
"run `pnpm bootstrap:admin`", but that command does nothing once any user exists (and it must
stay so). Another admin can reset a password from the website (`POST /users/:id/password`), but
a small shop has one admin. The fix is a command the person who runs the server can type on
the server itself: whoever can do that already owns the database.

Facts checked by Claude on 2026-11-06:
- `server/scripts/bootstrap-admin.ts` is the model for a script: it reads `dotenv`, uses
  `new PrismaService()` directly and does NOT boot the Nest app (under `tsx` injected services
  are undefined, which broke this very script before).
- Passwords are hashed with `argon2.hash(password)` (`server/src/users/users.service.ts`).
  The rule for a password is in `server/src/users/dto/reset-password.dto.ts` (8 characters or more).
- Old sessions: tokens are cut off through one row, table `session_gate`
  (`server/prisma/schema/auth.prisma`, `server/src/auth/` — read `SessionGateService`).

=== MESSAGE ===
Add one command to the server, `pnpm reset-password`, and correct the docs that promise a recovery that does not work. Server and docs only: `server/**`, `docs/decisions/0053-first-boot-setup.md`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/owner-recovery`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding. Then read `server/scripts/bootstrap-admin.ts`, `server/scripts/clear-recovery.ts`, `server/src/users/users.service.ts` (`resetPassword`), `server/src/users/dto/reset-password.dto.ts`, `server/src/auth/` (how a token is refused after the session cutoff), `server/README.md`, `server/src/setup/README.md`, `docs/decisions/0053-first-boot-setup.md`.

1. The command. New file `server/scripts/reset-password.ts`, new script `"reset-password": "tsx scripts/reset-password.ts"` in `server/package.json`.
   - It takes the account's email from the environment variable `RESET_EMAIL` and the new password from `RESET_PASSWORD`. Nothing is read from the command line's arguments (they stay in the shell's history and in the process list). If either is missing, print how to use it and exit with code 1.
   - The password must pass the same rule as the website's reset (8 characters or more, the DTO's upper limit too). Reuse the numbers from the DTO by importing a constant; if the DTO has only literals, move them into one exported constant next to the DTO and use it in both places. Too short or too long: print why, exit 1, change nothing.
   - Unknown email: print "No user with this email" and exit 1. Do not list the existing emails.
   - It sets the new hash (argon2, as the service does), makes the account active again if it was switched off (read the `users` model for the column), and ends the sessions that exist: use the session cutoff the app already has. If that cutoff is for everyone at once, say so in the printed message ("everyone must sign in again") and in the README. Do not invent a per-user mechanism.
   - It does not give or change any role or permission. If the account is not an admin, it prints one line saying so; that is all.
   - It prints one line on success with the email, never the password and never the hash.
   - Like `bootstrap-admin.ts`: `new PrismaService()` directly, no `NestFactory`, close the connection in `finally`.
   - Put the pure parts (reading and checking the two values) in `server/scripts/lib/` as a small function with a unit test next to it (`*.spec.ts`; check that `pnpm test` picks up tests under `scripts/`; if it does not, put the function under `server/src/common/lib/` instead and say so).

2. Try it for real, on a database you make yourself (`createdb opencode_reset_test`, then `DATABASE_URL=...opencode_reset_test pnpm exec prisma migrate deploy`, `pnpm prisma db seed`, `pnpm bootstrap:admin` with test values of your own). Run the command with: a missing variable, a 5-character password, an unknown email, then a good one. Paste the four outputs. Then show the new password works: `argon2.verify` in a one-line script, or a sign-in if you start the server. Drop the database at the end. Never run it against the database named in `server/.env`.

3. Docs.
   - `server/README.md`: the "Locked-out owner recovery" line and the scripts list: `pnpm reset-password` with the two variables and one example line; say that `bootstrap:admin` only creates the FIRST admin.
   - `server/src/setup/README.md` ("Locked-Out Recovery") and `docs/decisions/0053-first-boot-setup.md`: the same correction, a line each. Keep each file within its 40 lines.

Checks. Run them and paste the real output:
```
cd server && pnpm install && pnpm build && pnpm test && pnpm lint
```
Then `graphify update .` in `server/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`): the code, then the docs, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `client/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`, `server/src/generated/**`, any migration.

Fill the Result section of `docs/handoffs/opencode/013-owner-recovery-command.md`, set Status to done, and commit that too. Report only what you ran. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Files changed:
- How old sessions are ended (one user or everyone), and where that is in the code:
- The four outputs of the real try, and the proof the new password works:
- `pnpm build`, `pnpm test`, `pnpm lint` (last lines):
- Not done / skipped / failed:

## Check by Claude
