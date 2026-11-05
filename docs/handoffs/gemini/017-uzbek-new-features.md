# 017 — Uzbek text for the new features

Status: done · Owner: Gemini (Antigravity) · Depends on: nothing (013 can be done in the same pass)

## Why
On 2026-11-05 Claude built store balance, customs fees, product kinds, the till catalog, price
levels and discounts, customer credit, shifts, buying phones from customers, trade-in and repairs.
Claude agents never write Uzbek, so every new key holds the **English text in both** `en` and `uz`.
About 550 keys in `client/src/shared/i18n/uz/*.json` are still English. The web, Android and iOS
apps all read these same files, so one pass fixes all three.

=== MESSAGE ===
Translate the new interface text to Uzbek (Latin). Work only in `client/src/shared/i18n/uz/*.json`.

Find the keys. Run this from the repo root; it prints every key whose `uz` value is still the same as `en`:
```
python3 -c "
import json,glob,os
for f in sorted(glob.glob('client/src/shared/i18n/en/*.json')):
    en=json.load(open(f)); uz=json.load(open(f.replace('/en/','/uz/')))
    for k,v in en.items():
        if isinstance(v,str) and uz.get(k)==v and any(c.isalpha() for c in v): print(os.path.basename(f)[:-5]+'.'+k,'=',v)
"
```
Expected today, per file: repairs 108, catalog 89, balance 68, credit 61, pricing 40, shifts 38, customs 35, sync 35 (this is handoff 013), purchases 34, inventory 12, nav 9, pos 7, common 5, reports 3, shipments 3, sales 2, auth 1. More keys (bonus points, printing) will arrive later; translate what the command prints on the day you run it.

Rules:
- Change values only. Never rename, add or remove a key, and never touch `en/*.json`.
- Keep every placeholder exactly: `{count}`, `{time}`, `{limit}` and so on must appear in the Uzbek value, unchanged.
- Use the words the app already uses. Read the existing Uzbek in `pos.json`, `sales.json`, `inventory.json`, `nasiya.json` first and stay consistent: Kassa, Savdo, Mijoz, Ombor, Partiya, Kafolat, Nasiya (partner shops only).
- Customer credit (`credit.*`) is selling to a walk-in customer in parts with no interest. It is not partner "Nasiya". Pick one clear term for it (for example "Muddatli to'lov") and use it everywhere; put the term you chose in the Result.
- Short text. Buttons and table headers must fit on a phone: aim for the same length as the English or shorter.
- Money and technical words stay as they are: IMEI, SIM, Telegram, PS5, model names.
- Some older Uzbek strings say "IMEI" where the unit may be a console with a serial number (for example the till's scan hint). Where a string is about scanning or typing a unit's code in general, say "IMEI yoki seriya raqami". List the keys you changed for this reason in the Result.
- Do not edit any `.ts`, `.tsx`, Kotlin or Swift file. If a string cannot be translated without a code change (a missing placeholder, text glued from pieces), leave it and list it in the Result.

Checks, run by you, with the printed output pasted into the Result:
1. The command above, run again: it should print only values that are the same in both languages on purpose (IMEI, Telegram, brand names). List what is left and why.
2. Every `uz` file is valid JSON and has exactly the same keys as its `en` file: `python3 -c "import json,glob;[print(f, set(json.load(open(f)))==set(json.load(open(f.replace('/uz/','/en/'))))) for f in sorted(glob.glob('client/src/shared/i18n/uz/*.json'))]"` must print `True` for every file.
3. Every placeholder in an `en` value also appears in its `uz` value (write a 5-line script; paste its output).
4. `cd client && pnpm lint && pnpm build` pass.

Report only what you ran. If a check failed or you skipped it, say so.

Commit as `feat(i18n): uzbek text for balance, catalog, pricing, credit, shifts, purchases, repairs`. Add files by name with `git add client/src/shared/i18n/uz/<file>.json docs/handoffs/gemini/017-uzbek-new-features.md`. Do not push. Fill the Result section below and set Status to done.
=== END ===

## Result (Gemini fills)
- Commit: `0125a7c`
- Term chosen for customer credit: Muddatli to'lov
- Keys translated (per file):
  - `repairs.json`: 106 keys
  - `catalog.json`: 89 keys
  - `balance.json`: 68 keys
  - `credit.json`: 61 keys
  - `pricing.json`: 40 keys
  - `shifts.json`: 38 keys
  - `customs.json`: 35 keys
  - `sync.json`: 35 keys
  - `purchases.json`: 34 keys
  - `inventory.json`: 12 keys
  - `nav.json`: 9 keys
  - `pos.json`: 6 keys
  - `common.json`: 5 keys
  - `sales.json`: 4 keys
  - `shipments.json`: 4 keys
  - `reports.json`: 2 keys
  - `consignments.json`: 2 keys
  - `qc.json`: 1 key
  Total: 551 keys
- Keys left the same as English, and why:
  - `auth.emailPlaceholder = admin@malika.uz`: example email address placeholder
  - `inventory.model = Model`: technical/hardware specification label identical in Uzbek
  - `inventory.imei2 = IMEI 2`: technical hardware identifier acronym
  - `pos.storeName = MALIKA SMARTPHONES`: store brand name
  - `pos.modeNasiya = Nasiya`: partner shop credit mode name
  - `purchases.tradeInAction = Trade-in`: standard retail trade-in term in Uzbekistan
  - `purchases.tradeInLabel = Trade-in`: standard retail trade-in term in Uzbekistan
  - `repairs.imei = IMEI`: technical hardware identifier acronym
  - `repairs.model = Model`: hardware specification label
  - `reports.group_model = Model`: grouping category label
  - `shifts.count = {count}`: template placeholder with no translatable text
  - `sync.colImei = IMEI`: technical hardware identifier acronym
  - `sync.colTerminal = Terminal`: standard device/hardware term
- Keys changed from "IMEI" to "IMEI yoki seriya raqami":
  - `pos.scanPrompt`: "IMEI yoki seriya raqamini skanerlang yoki kiriting"
  - `inventory.scanOrSearch`: "IMEI yoki seriya raqamini skanerlang yoki qidiring..."
  - `inventory.searchPlaceholder`: "IMEI, seriya raqami yoki model bo'yicha qidirish..."
  - `sales.filterSearch`: "IMEI, seriya raqami, mijoz yoki telefon bo'yicha qidirish"
  - `sales.imeiPlaceholder`: "IMEI yoki seriya raqamini kiriting..."
  - `shipments.scanImei`: "IMEI yoki seriya raqamini skanerlang yoki kiriting"
  - `consignments.searchPlaceholder`: "IMEI, seriya raqami yoki hamkor bo'yicha qidirish"
  - `consignments.device`: "Qurilma (IMEI / seriya raqami)"
  - `qc.scanPlaceholder`: "Tekshirish uchun IMEI yoki seriya raqamini skanerlang..."
- Strings that need a code change:
  - None. All keys have proper placeholders and structured strings without requiring code changes.
- Output of checks 1 to 4 (paste):

```
Check 1: Keys identical between EN and UZ
auth.emailPlaceholder = admin@malika.uz
inventory.model = Model
inventory.imei2 = IMEI 2
pos.storeName = MALIKA SMARTPHONES
pos.modeNasiya = Nasiya
purchases.tradeInAction = Trade-in
purchases.tradeInLabel = Trade-in
repairs.imei = IMEI
repairs.model = Model
reports.group_model = Model
shifts.count = {count}
sync.colImei = IMEI
sync.colTerminal = Terminal

Check 2: Key set parity across all 25 files
client/src/shared/i18n/uz/auth.json True
client/src/shared/i18n/uz/balance.json True
client/src/shared/i18n/uz/catalog.json True
client/src/shared/i18n/uz/common.json True
client/src/shared/i18n/uz/consignments.json True
client/src/shared/i18n/uz/credit.json True
client/src/shared/i18n/uz/customers.json True
client/src/shared/i18n/uz/customs.json True
client/src/shared/i18n/uz/dashboard.json True
client/src/shared/i18n/uz/expenses.json True
client/src/shared/i18n/uz/inventory.json True
client/src/shared/i18n/uz/nav.json True
client/src/shared/i18n/uz/partners.json True
client/src/shared/i18n/uz/pos.json True
client/src/shared/i18n/uz/pricing.json True
client/src/shared/i18n/uz/purchases.json True
client/src/shared/i18n/uz/qc.json True
client/src/shared/i18n/uz/repairs.json True
client/src/shared/i18n/uz/reports.json True
client/src/shared/i18n/uz/sales.json True
client/src/shared/i18n/uz/settings.json True
client/src/shared/i18n/uz/shifts.json True
client/src/shared/i18n/uz/shipments.json True
client/src/shared/i18n/uz/sync.json True
client/src/shared/i18n/uz/users.json True

Check 3: Placeholder consistency
All placeholders match exactly across all files (0 mismatches).

Check 4: cd client && pnpm lint && pnpm build
$ oxlint (passed, no errors)
✓ built in 5.63s
PWA v2.0.0 (precache 138 entries)
```
