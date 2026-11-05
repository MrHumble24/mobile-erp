import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { saleRepository } from "../api/sale.repository"
import { saleKeys } from "../api/sale.keys"
import { deviceKeys } from "@/entities/device"
import type { CreateSaleDto, ReturnSaleDto, SaleFilters } from "./sale.types"

export function useSales(filters?: SaleFilters) {
  return useQuery({
    queryKey: saleKeys.list(filters),
    queryFn: () => saleRepository.list(filters),
  })
}

export function useSalesStats(filters?: SaleFilters) {
  return useQuery({
    queryKey: saleKeys.stats(filters),
    queryFn: () => saleRepository.stats(filters),
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: () => saleRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useSaleReceipt(id?: string | null) {
  return useQuery({
    queryKey: saleKeys.receipt(id || ""),
    queryFn: () => saleRepository.getReceipt(id || ""),
    enabled: Boolean(id),
  })
}

export function useWarrantyLookup(imei?: string | null) {
  const code = imei?.trim() ?? ""
  return useQuery({
    queryKey: saleKeys.warranty(code),
    queryFn: () => saleRepository.getWarranty(code),
    // Any unit code: an IMEI or a serial number (ADR 0029); server resolves either.
    enabled: code.length >= 3,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateSaleDto) => saleRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

export function useReturnSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReturnSaleDto }) =>
      saleRepository.returnSale(id, dto),
    onSuccess: () => {
      // saleKeys.all covers lists, stats and detail for this entity.
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}
