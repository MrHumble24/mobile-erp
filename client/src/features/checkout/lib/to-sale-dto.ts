import type { CreateSaleDto } from "@/entities/sale"
import type { PaymentPart } from "@/entities/ledger"
import type { LevelCode } from "@/entities/pricing"
import { fromCents } from "@/entities/pricing"
import type { CartCustomer, CartLine } from "../model/cart.store"
import { lineFinalPrice, lineListCents } from "./line-pricing"

/**
 * Maps one cart line + the shared customer to a POST /sales payload
 * (ADR 0029/0030/0034). The sale carries the price level, and — when the shop
 * has a list price and the cashier did not override it — the discount, so the
 * server can re-derive and verify the final price. `listPrice` is sent for the
 * offline-replay path (the server only honours it there).
 */
export function toSaleDto(
  line: CartLine,
  customer: CartCustomer | null,
  level: LevelCode,
  payments?: PaymentPart[]
): CreateSaleDto {
  const listCents = lineListCents(line, level)
  const hasList = listCents !== null && !line.overrideActive
  const discount =
    hasList && line.discount && line.discount.value > 0 ? line.discount : undefined

  const shared = {
    salePrice: lineFinalPrice(line, level),
    customerId: customer?.id,
    customer:
      !customer?.id && customer?.name
        ? { name: customer.name, phone: customer.phone }
        : undefined,
    notes: line.notes.trim() || undefined,
    clientMutationId: line.clientMutationId,
    payments,
    priceLevelCode: level,
    discount,
    listPrice: listCents !== null ? fromCents(listCents) : undefined,
  }
  if (line.kind === "quantity") {
    return { ...shared, modelId: line.modelId, quantity: line.quantity }
  }
  const identifier = line.device.imei
    ? { imei: line.device.imei }
    : { serialNumber: line.device.serialNumber ?? undefined }
  return {
    ...shared,
    ...identifier,
    warrantyDays: line.warrantyDays,
    expectedVersion: line.device.version,
  }
}
