import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { partnerRepository } from "../api/partner.repository"
import { partnerKeys } from "../api/partner.keys"
import type {
  CreatePartnerDto,
  PartnerFilters,
  RecordPaymentDto,
  UpdatePartnerDto,
} from "./partner.types"

export function usePartners(filters?: PartnerFilters) {
  return useQuery({
    queryKey: partnerKeys.list(filters),
    queryFn: () => partnerRepository.list(filters),
  })
}

export function usePartnerAging(partnerId?: string | null) {
  return useQuery({
    queryKey: partnerKeys.aging(partnerId || ""),
    queryFn: () => partnerRepository.aging(partnerId || ""),
    enabled: Boolean(partnerId),
  })
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: partnerKeys.detail(id),
    queryFn: () => partnerRepository.get(id),
    enabled: Boolean(id),
  })
}

export function usePartnerLedger(partnerId?: string | null) {
  return useQuery({
    queryKey: partnerKeys.ledger(partnerId || ""),
    queryFn: () => partnerRepository.ledger(partnerId || ""),
    enabled: Boolean(partnerId),
  })
}

export function useCreatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePartnerDto) => partnerRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() })
    },
  })
}

export function useUpdatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePartnerDto }) =>
      partnerRepository.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: partnerKeys.detail(variables.id) })
    },
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      partnerId,
      dto,
    }: {
      partnerId: string
      dto: RecordPaymentDto
    }) => partnerRepository.recordPayment(partnerId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: partnerKeys.ledger(variables.partnerId) })
    },
  })
}
