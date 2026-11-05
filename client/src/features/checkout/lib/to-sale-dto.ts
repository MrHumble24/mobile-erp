import type { CreateSaleDto } from "@/entities/sale"
import type { PaymentPart } from "@/entities/ledger"
import type { CartCustomer, CartLine } from "../model/cart.store"

/** Maps one cart line + the shared customer to a POST /sales payload. */
export function toSaleDto(
  line: CartLine,
  customer: CartCustomer | null,
  payments?: PaymentPart[]
): CreateSaleDto {
  const identifier = line.device.imei
    ? { imei: line.device.imei }
    : { serialNumber: line.device.serialNumber ?? undefined }
  return {
    ...identifier,
    salePrice: line.salePrice,
    customerId: customer?.id,
    customer:
      !customer?.id && customer?.name
        ? { name: customer.name, phone: customer.phone }
        : undefined,
    warrantyDays: line.warrantyDays,
    notes: line.notes.trim() || undefined,
    clientMutationId: line.clientMutationId,
    expectedVersion: line.device.version,
    payments,
  }
}
