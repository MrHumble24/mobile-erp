# 0057 — Danger zone: erase the shop's data

Date: 2026-11-06
Status: Accepted

## Context
A shop tries the system with test data, then wants a clean slate to go live.
Until now only a developer with database access could do it. We want it in the
app, company-wide, with strong warnings — built on the backup feature.

## Decision
- **Four groups**, every `@@map` table in exactly one (`wipe-tables.spec.ts`
  reads the schema and fails otherwise, so a new table must be classified):
  - **ALWAYS** (28) — everything the shop did; erased every time.
  - **CONTACTS** (3) — customers, partners, suppliers; opt-in box.
  - **CATALOG** (7) — products, categories, product/customs prices, stock-alert
    rules, and `ref_model_links` (the product→reference link, which dies with
    the product); opt-in box.
  - **KEPT** (37) — accounts, roles, branches, settings, backups, secrets, the
    system lookups, the phone reference lists, and the erase log.
- **Classifications not spelled out in the handoff:** `unit_prices` → ALWAYS
  (a per-device price, dies with the device, not a catalogue price);
  `product_kinds` and `price_levels` → KEPT (system lookups); `expense_categories`
  → KEPT (a configured list, seeded in `seed.sql`); `ref_apple_box_codes` /
  `ref_imei_tacs` → KEPT (free reference lists, not our data).
- **No cascade.** One transaction deletes each group's tables children-before-
  parents, in FK-safe order. `CASCADE` could reach a KEPT table; explicit order
  proves it cannot (the e2e counts every KEPT table before/after). Any statement
  failing rolls the whole transaction back — nothing erased.
- **Kept rows pointing at erased rows: none.** Every cross-group FK runs
  erased→kept (a device → its status/store/user; a customer → its price level),
  so deleting erased rows never orphans a kept row; nothing to null out.
- **Uploads:** catalogue picture files are deleted after commit (names read
  first); the shop logo is never touched (only product images live in uploads).
- **Order of work** mirrors restore: confirm (shop name + password + "I
  understand") → refuse if a backup/restore/erase runs → safety backup (stop if
  no passphrase or it fails) → maintenance + erase → end sessions → record +
  best-effort Telegram. The erase is atomic; the restore recovery marker guards
  the maintenance switch across a crash. New permission `data.wipe` (ADMIN only).

## Consequences
- The only undo is restoring the safety backup made first.
- Back to first boot (also users, branches, settings) is out of scope — it needs
  the setup wizard (handoff 024 / 026), not merged yet.
