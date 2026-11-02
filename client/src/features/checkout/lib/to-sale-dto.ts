import type { CreateSaleDto } from "@/entities/sale"
import type { CartCustomer, CartLine } from "../model/cart.store"

/** Maps one cart line + the shared customer to a POST /sales payload. */
export function toSaleDto(line: CartLine, customer: CartCustomer | null): CreateSaleDto {
  return {
    imei: line.device.imei,
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
  }
}
