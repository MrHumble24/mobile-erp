import type { LedgerFilters } from "../model/ledger.types"

export const ledgerKeys = {
  all: ["ledger"] as const,
  accounts: () => [...ledgerKeys.all, "accounts"] as const,
  balances: (allStores?: boolean) =>
    [...ledgerKeys.all, "balances", { allStores: Boolean(allStores) }] as const,
  transactions: () => [...ledgerKeys.all, "transactions"] as const,
  transactionList: (filters?: LedgerFilters) =>
    [...ledgerKeys.transactions(), filters] as const,
}
