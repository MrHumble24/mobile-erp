# 0027 — Customs fee per phone from a price list

Date: 2026-11-05
Status: Accepted

## Context

Customs publishes a fee per model code ("tamozhnya"); the store loads a new
list every few months. Each phone's fee is the one current when it is scanned
in, and it never changes afterwards. The client's Excel file has not arrived,
so no file upload is built yet — only the data model and a JSON API it will sit
on later.

## Decision

- `DeviceModel` gains `customsCode` (optional; how customs writes the model;
  several models may share one). `Device` gains `customsFee` (Decimal, default
  0), stamped at intake from the current list via the model's `customsCode`; no
  list or no match stamps 0. It joins landed cost: `acquisitionCost +
  customsFee + unitExpense` (ADR 0026).
- Two append-only tables (`customs.prisma`): `customs_price_lists` (one row per
  version: `effectiveAt`, `note?`, who, when) and `customs_price_list_items`
  (`customsCode`, `description?`, `fee`; unique per list + code). Versions are
  never edited or deleted. The **current** list is the newest `effectiveAt`.
- A later list never touches an already-stamped phone — the fee is only read at
  intake. A hand fix (`PATCH /devices/:id/customs-fee`, `customs.manage`)
  recomputes landed cost and posts the **CUSTOMS difference**; a sold phone
  keeps its `landedCostSnapshot`.
- Intake posts a `CUSTOMS` row (new ledger type) when the stamped fee > 0, from
  the shipment's account and store, like `PURCHASE`.
- Reads need `customs.read`, writes `customs.manage` (both ADMIN only): create a
  version; list versions; the current list with each item's previous-version
  fee and whether a model uses the code; models with no code or a code missing
  from the current list; a code's fee history across versions.
- Shipment responses gain computed `customsFeeTotal` and
  `devicesWithoutCustomsFee`. `customsFee`/`customsFeeTotal` are cost-restricted.

## Consequences

- The Excel upload is layered on top later: it becomes another writer of
  `createPriceList`. The match may extend to model + storage with one column.
