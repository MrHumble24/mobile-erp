import { http } from "@/shared/api/http"
import type {
  AgingBucket,
  CreatePartnerDto,
  LedgerEntry,
  PartnerFilters,
  PartnerView,
  RecordPaymentDto,
  UpdatePartnerDto,
} from "../model/partner.types"

export const partnerRepository = {
  list: async (filters?: PartnerFilters): Promise<PartnerView[]> => {
    return http<PartnerView[]>("/partners", {
      params: filters as Record<string, string | number | boolean | undefined>,
    })
  },

  get: async (id: string): Promise<PartnerView> => {
    return http<PartnerView>(`/partners/${id}`)
  },

  ledger: async (id: string): Promise<LedgerEntry[]> => {
    return http<LedgerEntry[]>(`/partners/${id}/ledger`)
  },

  aging: async (id: string): Promise<AgingBucket[]> => {
    return http<AgingBucket[]>(`/partners/${id}/aging`)
  },

  create: async (dto: CreatePartnerDto): Promise<PartnerView> => {
    return http<PartnerView>("/partners", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdatePartnerDto): Promise<PartnerView> => {
    return http<PartnerView>(`/partners/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  recordPayment: async (
    partnerId: string,
    dto: RecordPaymentDto
  ): Promise<unknown> => {
    return http<unknown>(`/partners/${partnerId}/payments`, {
      method: "POST",
      body: dto,
    })
  },
}
