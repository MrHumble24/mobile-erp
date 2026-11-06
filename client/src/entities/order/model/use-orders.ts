import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orderRepository } from "../api/order.repository"
import { orderKeys } from "../api/order.keys"
import type {
  ListOrdersQuery,
  UpdateOrderStatusDto,
  HandOverOrderDto,
} from "../api/order.types"

export function useStorefrontOrders(params?: ListOrdersQuery) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderRepository.list(params),
    staleTime: 10_000,
  })
}

export function useStorefrontOrderStats() {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: orderRepository.getStats,
    refetchInterval: 15_000,
  })
}

export function useStorefrontOrder(id: string | null | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => orderRepository.getById(id!),
    enabled: Boolean(id),
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOrderStatusDto }) =>
      orderRepository.updateStatus(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(orderKeys.detail(data.id), (old: unknown) => {
        if (!old || typeof old !== "object") return old
        return { ...old, ...data }
      })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export function useHoldOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: { deviceId?: string } }) =>
      orderRepository.hold(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(orderKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: ["catalog"] })
      queryClient.invalidateQueries({ queryKey: ["devices"] })
    },
  })
}

export function useHandOverOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: HandOverOrderDto }) =>
      orderRepository.handOver(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(orderKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["ledger"] })
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
    },
  })
}
