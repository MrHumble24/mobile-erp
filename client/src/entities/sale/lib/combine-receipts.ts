import type { ReceiptView } from "../model/sale.types"

/**
 * Folds per-sale receipts (same cashier/customer, one device each) into a single
 * printable receipt: items concatenated with their warranty attached per item,
 * total summed. The server has no multi-item receipt endpoint, so this is composed
 * client-side from `GET /sales/:id/receipt` payloads.
 */
export function combineReceipts(receipts: ReceiptView[]): ReceiptView | null {
  if (receipts.length === 0) return null
  const first = receipts[0]
  if (receipts.length === 1) return first

  const items = receipts.flatMap((r) =>
    r.items.map((item) => ({ ...item, warranty: r.warranty }))
  )
  const total = receipts.reduce((sum, r) => sum + Number(r.total), 0)

  return {
    saleId: first.saleId,
    soldAt: first.soldAt,
    cashier: first.cashier,
    customer: first.customer,
    items,
    total: String(total),
    warranty: null,
  }
}
