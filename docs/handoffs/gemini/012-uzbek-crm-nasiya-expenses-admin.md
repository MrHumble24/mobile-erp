# 012 — Uzbek copy for customers, Nasiya, expenses, users and settings

Status: open · Owner: Gemini (Antigravity) · Depends on: `main` ≥ commit "fix(reports): exclude soft-deleted expenses"

## Why
Four screens were rebuilt in parallel and merged: `/customers` (directory, aggregates, purchase history),
`/partners` + `/consignments` (Nasiya: filters, aging buckets, ledger, batch consignment, condition on
return), `/expenses` (filters, by-category chart, categories tab, recurring templates, soft delete) and
`/users` + `/settings` (paginated users, effective permissions, password reset, role rename, sectioned
settings form). 224 keys hold English placeholders across six `uz` bundles because Claude agents never
hand-write Uzbek.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

Translate every key whose `uz` value still equals its `en` value in these bundles under `client/src/shared/i18n/` (224 keys in total; a script that compares the two JSON files finds them):
- `customers.json` → 48 keys
- `partners.json` → 22 keys
- `consignments.json` → 27 keys
- `expenses.json` → 54 keys
- `users.json` → 54 keys
- `settings.json` → 19 keys

Context by screen:
- `customers`: whole bundle is new (page title/description, filters `filterPurchases`/`sort*`, tiles `stat*`, columns `col*`, detail sheet `detailTitle`/`purchaseHistory`/`daysLeft` (`{count}` days of warranty left), form `err*` validation, `saved`).
- `partners`: `creditUsed`/`creditUnlimited` (credit-limit bar), `stats*` tiles, `agingTitle` + `aging_current`, `aging_d1_30`, `aging_d31_60`, `aging_d61_90`, `aging_d90_plus` (days-past-due buckets, keep short), `overdueOnly` (switch), `newConsignmentForPartner`.
- `consignments`: `status*` (Out / Settled / Returned / Overdue), `stats*`, `daysOverdue` (suffix after a number), `returnCondition` + `conditionInStock`/`conditionDefective`, `settleHint` (explains that partial payments go through the partner ledger), `batchSuccess` (several devices consigned), `resultingSale`.
- `expenses`: `metric*` tiles (`metricVsPrevious` = change vs previous period), `tab*`, `vendor` (payee), `recurring*`/`frequency*`/`nextDueAt`/`generateDue`/`generated` (`{count}` expenses created from templates), `deactivate`/`reassignTo`/`reassignRequired` (category in use must be reassigned), validation `amountPositive`/`dateNotFuture`/`categoryRequired`, `deleteConfirm`.
- `users`: `tabProfile`/`tabOverrides`, `override*` (Inherit / Grant / Revoke per permission), `source*` (where a permission comes from, `sourceRoles` uses `{roles}`), `selfRolesLocked`/`selfPermsLocked` (you cannot change your own access), `resetPassword`/`newPassword`/`confirmPassword`, `deactivate`/`reactivate`, `systemRoleLocked`, `confirmDeleteRole` (`{role}`), `roleInUse` (`{count}` users), `rangeLabel` (`{from}-{to} of {total}`).
- `settings`: `section*` headings and `*Desc` one-line descriptions, `storeName`/`storePhone`/`storeAddress`/`receiptFooter`, `defaultNasiyaDueDays`/`overdueReminderDays`, `currencyFixed` (currency is fixed to USD), `unsaved`/`lastUpdated`.
Keep keys and `{placeholders}` unchanged; key sets identical between `en` and `uz`. Glossary: Aging → Muddat bo'yicha taqsimot (or your better term), Credit limit → Kredit limiti, Outstanding → Qarzdorlik, Recurring expense → Doimiy xarajat, Vendor/payee → Yetkazib beruvchi / Oluvchi, Override → Istisno ruxsat, Inherit → Roldan olinadi. Add what you coin.

Then review in context with the `owner@malika.uz` login (credentials in `server/.env`): every tab and filter on the six screens, open each detail sheet, run one return with condition, one category deactivation with reassign, one password reset, save the settings form. Fix wording that reads as literal translation; tile labels, badges and aging buckets must stay short.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for crm, nasiya, expenses and admin` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/012-uzbek-crm-nasiya-expenses-admin.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Glossary terms added:
- Wording changes proposed for `en`:
- Notes for other agents:
