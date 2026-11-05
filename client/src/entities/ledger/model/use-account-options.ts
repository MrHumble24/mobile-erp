import { useQuery } from "@tanstack/react-query"
import { ledgerRepository } from "../api/ledger.repository"
import { ledgerKeys } from "../api/ledger.keys"
import type { AccountOption } from "./payment.types"

/** Every store has these two; used when the balances read is denied. */
const FALLBACK_ACCOUNTS: AccountOption[] = [
  { accountCode: "CASH" },
  { accountCode: "CARD" },
]

/**
 * Active accounts for the payment pickers. Reads `GET /ledger/balances`
 * (shared cache with `useLedgerBalances`); when that is unavailable — e.g. a
 * cashier lacks `balance.read` and the request 403s — falls back to the two
 * known codes so checkout can still pick cash or card.
 */
export function useAccountOptions(): AccountOption[] {
  const { data } = useQuery({
    queryKey: ledgerKeys.balances(),
    queryFn: () => ledgerRepository.balances(),
    retry: false,
    staleTime: 60_000,
  })
  if (!data) return FALLBACK_ACCOUNTS
  return data.accounts.map((a) => ({ accountCode: a.accountCode, label: a.label }))
}
