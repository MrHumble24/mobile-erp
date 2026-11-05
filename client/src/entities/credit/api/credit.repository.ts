import { http } from "@/shared/api/http"
import type {
  CreateCreditDto,
  CreditContract,
  CreditListFilters,
  CreditListItem,
  CreditPaymentDto,
  CreditReport,
  CreditView,
} from "../model/credit.types"

export const creditRepository = {
  list: (filters: CreditListFilters): Promise<CreditListItem[]> =>
    http<CreditListItem[]>("/credits", {
      params: { customerId: filters.customerId, status: filters.status },
    }),

  get: (id: string): Promise<CreditView> => http<CreditView>(`/credits/${id}`),

  contract: (id: string): Promise<CreditContract> =>
    http<CreditContract>(`/credits/${id}/contract`),

  report: (): Promise<CreditReport> => http<CreditReport>("/credits/report"),

  create: (dto: CreateCreditDto): Promise<CreditView> =>
    http<CreditView>("/credits", { method: "POST", body: dto }),

  addPayment: (id: string, dto: CreditPaymentDto): Promise<CreditView> =>
    http<CreditView>(`/credits/${id}/payments`, { method: "POST", body: dto }),

  refund: (id: string, dto: CreditPaymentDto): Promise<CreditView> =>
    http<CreditView>(`/credits/${id}/refund`, { method: "POST", body: dto }),
}
