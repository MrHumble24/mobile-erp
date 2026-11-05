import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deviceKeys } from "@/entities/device"
import { stockKeys } from "@/entities/stock"
import { catalogKeys } from "@/entities/catalog"
import { customerKeys } from "@/entities/customer"
import { ledgerKeys } from "@/entities/ledger"
import { customerPurchaseRepository } from "../api/customer-purchase.repository"
import { customerPurchaseKeys } from "../api/customer-purchase.keys"
import type { CreateCustomerPurchaseDto, CustomerPurchaseFilters } from "./customer-purchase.types"

/** Purchases list, newest first, with date / customer / search filters (`purchase.read`). */
export function useCustomerPurchases(filters: CustomerPurchaseFilters) {
  return useQuery({
    queryKey: customerPurchaseKeys.list(filters),
    queryFn: () => customerPurchaseRepository.list(filters),
  })
}

/** One purchase (`purchase.read`). */
export function useCustomerPurchase(id: string | null) {
  return useQuery({
    queryKey: customerPurchaseKeys.detail(id ?? ""),
    queryFn: () => customerPurchaseRepository.get(id as string),
    enabled: Boolean(id),
  })
}

/** Buy a phone from a customer: the unit lands in stock and the money posts out. */
export function useCreatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerPurchaseDto) => customerPurchaseRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerPurchaseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() })
      queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all })
    },
  })
}
