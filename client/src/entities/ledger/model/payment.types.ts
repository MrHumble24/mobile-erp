/** How a sale is tendered. Split spreads the price across accounts. */
export type PaymentMethod = "cash" | "card" | "split"

/** One tender line: money against a ledger account. Amount in major units. */
export interface PaymentPart {
  accountCode: string
  amount: number
}

/** A selectable ledger account. `label` is the server's; the UI prefers the
 *  translated `balance.account…` key and falls back to this. */
export interface AccountOption {
  accountCode: string
  label?: string
}
