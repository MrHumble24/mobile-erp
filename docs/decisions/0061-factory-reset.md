# 0061 — Factory reset: return to first-boot wizard

Date: 2026-11-06
Status: Accepted

## Context
A customer needs to erase all data, accounts, branches, secrets, and settings to repurpose or decommission the system, returning it to the first-boot onboarding wizard.

## Decision
- **Table classification**: Extends ADR 0057 table partitioning. Every KEPT table is explicitly labeled as either erased by factory reset (`RESET_ERASED_KEPT_TABLES`, 16 tables) or permanent (`NEVER_ERASED_TABLES`, 25 tables).
- **Two exceptions**: The post-reset database matches a freshly seeded database (`migrate deploy` + `seed.sql`) on every table except `backup_runs` (retains the safety backup) and `data_wipe_runs` (retains the reset audit log).
- **Audit record**: Performed user email stored as plain text (`performedByName`) so audit trail survives `users` table deletion.
- **Uploads & Secrets**: All uploads (including logo) and all rows in `secrets` are deleted. Undoing reset requires re-entering the backup passphrase.
- **Safety backup survival**: Local backups retain accessibility when `backup_targets` is wiped by falling back to `backup_runs.fileName`.
- **First-boot code without restart**: `SetupService` detects zero users, creates a new SHA-256 setup code file in `data/`, logs it to console, and serves `/setup`.
- **Refusals**: Requires permission `data.reset`, matching shop name, current owner password, exact sentence `"erase everything"`, and `understood === true`. Stopped if backup, restore, or wipe is running.
- **Client flow**: Danger Zone displays separate "Factory reset" card under Erase. Plain-language warnings cover all 4 consequences. After reset completes, client cleans caches/session and transitions directly to `/setup`.
