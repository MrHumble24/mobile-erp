import type { CreditLineDto } from "@/entities/credit"
import type { LevelCode } from "@/entities/pricing"
import type { CartLine } from "../model/cart.store"
import { lineFinalPrice, lineListCents } from "./line-pricing"

/**
 * Maps one cart line to a credit line — the same body `POST /sales` takes, so a
 * credit prices each line exactly as the ordinary checkout would (ADR 0034/0035):
 * list − discount at the current level, or the typed/override price when the shop
 * set none. Credit is online only, so no `listPrice`/`expectedVersion` replay
 * fields are sent.
 */
export function toCreditLine(line: CartLine, level: LevelCode): CreditLineDto {
  const listCents = lineListCents(line, level)
  const hasList = listCents !== null && !line.overrideActive
  const discount =
    hasList && line.discount && line.discount.value > 0 ? line.discount : undefined

  const base = {
    salePrice: lineFinalPrice(line, level),
    priceLevelCode: level,
    discount,
    notes: line.notes.trim() || undefined,
  }
  if (line.kind === "quantity") {
    return { ...base, modelId: line.modelId, quantity: line.quantity }
  }
  const identifier = line.device.imei
    ? { imei: line.device.imei }
    : { serialNumber: line.device.serialNumber ?? undefined }
  return { ...base, ...identifier, warrantyDays: line.warrantyDays }
}

/** Every cart line as a credit line, priced at the given level. */
export function toCreditLines(lines: CartLine[], level: LevelCode): CreditLineDto[] {
  return lines.map((line) => toCreditLine(line, level))
}
