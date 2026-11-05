import { useQuery } from "@tanstack/react-query"
import { ledgerRepository } from "../api/ledger.repository"
import { ledgerKeys } from "../api/ledger.keys"
import type { AccountOption } from "./payment.types"

/** Every store has these two; used while `GET /ledger/accounts` is in flight. */
const FALLBACK_ACCOUNTS: AccountOption[] = [
  { accountCode: "CASH" },
  { accountCode: "CARD" },
]

/**
 * Active accounts for the payment / expense / purchase pickers. Reads
 * `GET /ledger/accounts` — open to any signed-in user, no `balance.read` — so
 * a cashier sees the real account list. Falls back to the two known codes only
 * until the request resolves.
 */
export function useAccountOptions(): AccountOption[] {
  const { data } = useQuery({
    queryKey: ledgerKeys.accounts(),
    queryFn: () => ledgerRepository.accounts(),
    staleTime: 60_000,
  })
  if (!data) return FALLBACK_ACCOUNTS
  return data.map((a) => ({ accountCode: a.accountCode, label: a.label }))
}
