import type { CreateSaleDto } from "@/entities/sale"
import type { PaymentPart } from "@/entities/ledger"
import type { CartCustomer, CartLine } from "../model/cart.store"
import { lineTotal } from "./line-total"

/** Maps one cart line + the shared customer to a POST /sales payload (ADR 0029/0030). */
export function toSaleDto(
  line: CartLine,
  customer: CartCustomer | null,
  payments?: PaymentPart[]
): CreateSaleDto {
  const shared = {
    salePrice: lineTotal(line),
    customerId: customer?.id,
    customer:
      !customer?.id && customer?.name
        ? { name: customer.name, phone: customer.phone }
        : undefined,
    notes: line.notes.trim() || undefined,
    clientMutationId: line.clientMutationId,
    payments,
  }
  if (line.kind === "quantity") {
    // A quantity sale: modelId + pieces, no warranty, no device version to guard.
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
