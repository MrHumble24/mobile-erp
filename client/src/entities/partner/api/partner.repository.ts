import { http } from "@/shared/api/http"
import type {
  CreatePartnerDto,
  LedgerEntry,
  PartnerView,
  RecordPaymentDto,
  UpdatePartnerDto,
} from "../model/partner.types"

export const partnerRepository = {
  list: async (): Promise<PartnerView[]> => {
    return http<PartnerView[]>("/partners")
  },

  get: async (id: string): Promise<PartnerView> => {
    return http<PartnerView>(`/partners/${id}`)
  },

  ledger: async (id: string): Promise<LedgerEntry[]> => {
    return http<LedgerEntry[]>(`/partners/${id}/ledger`)
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
