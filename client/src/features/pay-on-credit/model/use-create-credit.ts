import { useMutation, useQueryClient } from "@tanstack/react-query"
import { creditRepository, creditKeys, type CreateCreditDto } from "@/entities/credit"
import { customerKeys } from "@/entities/customer"
import { saleKeys } from "@/entities/sale"
import { deviceKeys } from "@/entities/device"
import { stockKeys } from "@/entities/stock"
import { catalogKeys } from "@/entities/catalog"
import { ledgerKeys } from "@/entities/ledger"

/**
 * Sell a whole cart on credit in one atomic `POST /credits` (ADR 0035). On
 * success the stock, customer position and ledger all move, so every touched
 * entity's lists are invalidated.
 */
export function useCreateCredit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCreditDto) => creditRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() })
      queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all })
    },
  })
}
