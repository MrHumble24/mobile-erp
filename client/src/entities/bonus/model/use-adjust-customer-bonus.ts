import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customerKeys } from "@/entities/customer"
import { bonusRepository } from "../api/bonus.repository"
import { bonusKeys } from "../api/bonus.keys"
import type { AdjustBonusDto } from "./bonus.types"

/** Owner correction; refreshes this customer's points and the POS lookup balances. */
export function useAdjustCustomerBonus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, dto }: { customerId: string; dto: AdjustBonusDto }) =>
      bonusRepository.adjust(customerId, dto),
    onSuccess: (_view, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: bonusKeys.detail(customerId) })
      queryClient.invalidateQueries({ queryKey: customerKeys.lookups() })
    },
  })
}
