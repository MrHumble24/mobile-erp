import { useQuery } from "@tanstack/react-query"
import { bonusRepository } from "../api/bonus.repository"
import { bonusKeys } from "../api/bonus.keys"

/** A customer's points balance + history; the server also says if bonus is on. */
export function useCustomerBonus(customerId: string) {
  return useQuery({
    queryKey: bonusKeys.detail(customerId),
    queryFn: () => bonusRepository.get(customerId),
    enabled: Boolean(customerId),
  })
}
