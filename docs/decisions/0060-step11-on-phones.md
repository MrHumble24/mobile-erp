# 0060 — Step 11 on phones (bonus points, printing, buy-back messages)

Date: 2026-11-06
Status: Accepted

## Context
Step 11 (ADR 0043/0044/0047) on the website puts loyalty points and receipt
printing behind store switches and maps the server's refusal codes to text.
This ADR records the same decisions on the Android phone.

## Decision
- The phones follow the same switches as the website and show nothing new
  while a switch is off (bonus only in the till, Print only on receipts).
- Points are shown as numbers, never money (`formatPoints`, no `$`).
- The points plan (`BonusRedeem`) sits on top of the trade-in plan, in cart
  order, with the same numbers as the website.
- A sale with points or a trade-in is posted directly and never queued.
- The till's own receipt shows points spent; points earned show only on the
  sale's own receipt (the server knows them, the phone does not compute).
- The shop name on a receipt comes from the server (`store`); the demo keys
  `pos.storeName` / `pos.storeLocation` are no longer used on Android.
- Print exists only while receipt printing is on, at 58 or 80 mm paper
  (anything other than 80 is 58).
- Refusals are mapped by server code, per feature (returns, buy-a-phone,
  till checkout), with the server message as the fallback.
- Price tags are not on the phones.
- iOS follows the same decisions (Gemini handoff 030).

## Consequences
- Offline printing uses the last known till settings (cached `GET /settings`).
- Buying back a phone the shop sold goes through (the server decides); only an
  IMEI that belongs to a unit that is NOT sold gets the translated refusal.
