import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { onlinePaymentRepository } from "../api/online-payment.repository"
import { onlinePaymentKeys } from "../api/online-payment.keys"
import type { UpdateProviderConfigDto } from "../api/online-payment.types"

export function useOnlinePaymentProviders() {
  return useQuery({
    queryKey: onlinePaymentKeys.providers(),
    queryFn: onlinePaymentRepository.listProviders,
    staleTime: 30_000,
  })
}

export function useUpdateOnlinePaymentProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      code,
      dto,
    }: {
      code: string
      dto: UpdateProviderConfigDto
    }) => onlinePaymentRepository.updateProvider(code, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(onlinePaymentKeys.provider(data.providerCode), data)
      queryClient.invalidateQueries({
        queryKey: onlinePaymentKeys.providers(),
      })
    },
  })
}

export function useSetOnlinePaymentSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, secret }: { code: string; secret: string }) =>
      onlinePaymentRepository.setSecret(code, secret),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: onlinePaymentKeys.providers(),
      })
    },
  })
}

export function useCheckOnlinePaymentProvider() {
  return useMutation({
    mutationFn: (code: string) =>
      onlinePaymentRepository.checkProvider(code),
  })
}

export function useRefundOnlinePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string
      reason?: string
    }) => onlinePaymentRepository.refundPayment(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-orders"] })
    },
  })
}
