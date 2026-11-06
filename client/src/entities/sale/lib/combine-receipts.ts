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
  const payments = mergePayments(receipts)
  const tradeIns = receipts.flatMap((r) => r.tradeIns ?? [])
  // Sum the list prices + discounts so the combined receipt shows "given away" (ADR 0034).
  const discountAmount = receipts.reduce((sum, r) => sum + Number(r.discountAmount ?? 0), 0)
  const listPrice = receipts.reduce((sum, r) => sum + Number(r.listPrice ?? r.total), 0)
  const bonus = receipts.reduce(
    (sum, r) => ({
      earned: sum.earned + Number(r.bonus.earned),
      spent: sum.spent + Number(r.bonus.spent),
    }),
    { earned: 0, spent: 0 }
  )

  return {
    saleId: first.saleId,
    soldAt: first.soldAt,
    cashier: first.cashier,
    customer: first.customer,
    items,
    total: String(total),
    listPrice: discountAmount > 0 ? String(listPrice) : null,
    discountAmount: discountAmount > 0 ? String(discountAmount) : null,
    priceLevelCode: first.priceLevelCode ?? null,
    warranty: null,
    payments,
    tradeIns,
    bonus: { earned: String(bonus.earned), spent: String(bonus.spent) },
  }
}

/** Sum the tender lines of every folded sale by account, so a combined receipt
 *  still reads "Cash X · Card Y" across the whole cart. */
function mergePayments(receipts: ReceiptView[]): ReceiptView["payments"] {
  const byAccount = new Map<string, number>()
  for (const r of receipts) {
    for (const p of r.payments ?? []) {
      byAccount.set(p.accountCode, (byAccount.get(p.accountCode) ?? 0) + Number(p.amount))
    }
  }
  return [...byAccount].map(([accountCode, amount]) => ({ accountCode, amount: String(amount) }))
}
