import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { storefrontRepository } from "../api/storefront.repository"
import { storefrontKeys } from "../api/storefront.keys"
import type { CreateStorefrontOrderDto, UpdateStorefrontSettingsDto } from "../api/storefront.types"

export function useStorefrontConfig() {
  return useQuery({
    queryKey: storefrontKeys.config(),
    queryFn: storefrontRepository.getConfig,
    staleTime: 60_000,
  })
}

export function useStorefrontProducts(params?: {
  categoryId?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: storefrontKeys.products(params),
    queryFn: () => storefrontRepository.getProducts(params),
    staleTime: 30_000,
  })
}

export function useStorefrontProduct(modelId: string) {
  return useQuery({
    queryKey: storefrontKeys.product(modelId),
    queryFn: () => storefrontRepository.getProduct(modelId),
    enabled: Boolean(modelId),
    staleTime: 30_000,
  })
}

export function useCreateStorefrontOrder() {
  return useMutation({
    mutationFn: (dto: CreateStorefrontOrderDto) => storefrontRepository.createOrder(dto),
  })
}

export function useStorefrontSettings() {
  return useQuery({
    queryKey: storefrontKeys.settings(),
    queryFn: storefrontRepository.getSettings,
    staleTime: 30_000,
  })
}

export function useUpdateStorefrontSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateStorefrontSettingsDto) => storefrontRepository.updateSettings(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(storefrontKeys.settings(), data)
      queryClient.invalidateQueries({ queryKey: storefrontKeys.config() })
      queryClient.invalidateQueries({ queryKey: storefrontKeys.all })
    },
  })
}
