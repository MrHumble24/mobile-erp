import { useQuery } from "@tanstack/react-query"
import { creditRepository } from "../api/credit.repository"
import { creditKeys } from "../api/credit.keys"
import type { CreditListFilters } from "./credit.types"

/** Credit list with optional customer + status filters (`sale.read`). */
export function useCredits(filters: CreditListFilters) {
  return useQuery({
    queryKey: creditKeys.list(filters),
    queryFn: () => creditRepository.list(filters),
  })
}

/** One credit with its sales, plan, payments and derived standing. */
export function useCredit(id: string | null) {
  return useQuery({
    queryKey: creditKeys.detail(id ?? ""),
    queryFn: () => creditRepository.get(id as string),
    enabled: Boolean(id),
  })
}

/** The paper contract payload for printing (`sale.read`). */
export function useCreditContract(id: string | null) {
  return useQuery({
    queryKey: creditKeys.contract(id ?? ""),
    queryFn: () => creditRepository.contract(id as string),
    enabled: Boolean(id),
  })
}

/** Store-wide credit totals and the customers behind them (`report.finance`). */
export function useCreditReport() {
  return useQuery({
    queryKey: creditKeys.report(),
    queryFn: () => creditRepository.report(),
  })
}
