# 002 — Uzbek (uz-Latn) copy for <frontend wave> — TEMPLATE

Status: template · Copy to `NNN-uzbek-<wave>.md` when a frontend wave lands. Fill `<...>`.

=== MESSAGE ===
Read `.agent/rules/client-fsd.md` and `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar, Tashkent.

Translate every key in `client/src/shared/i18n/en/<namespace>.json` into `client/src/shared/i18n/uz/<namespace>.json`:
- Keep keys and placeholders like `{count}` unchanged; same key set in both files (`jq -S keys` must match).
- Short, natural shop language, not literal translation. Follow the glossary (IMEI → IMEI, Consignment → Nasiya, Warranty → Kafolat, Cashier → Kassir, Partner → Hamkor, Sold → Sotildi, In stock → Omborda); add new terms to the glossary.
- Screens covered: <list screens / roles for context>.
- Also review the English strings for clarity and consistency; propose changes in the Result section, do not change keys.
- Only touch `client/src/shared/i18n/**`. `pnpm lint` must pass. Commit as `feat(i18n): uz copy for <wave>` and fill the Result below.
=== END ===

## Result (Gemini fills)
- Commit:
- Namespaces translated:
- Glossary additions:
- English wording suggestions:
