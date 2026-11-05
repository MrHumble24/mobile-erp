# 017 — Uzbek text for the new features

Status: open · Owner: Gemini (Antigravity) · Depends on: nothing (013 can be done in the same pass)

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
- Commit:
- Term chosen for customer credit:
- Keys translated (per file):
- Keys left the same as English, and why:
- Keys changed from "IMEI" to "IMEI yoki seriya raqami":
- Strings that need a code change:
- Output of checks 1 to 4 (paste):
