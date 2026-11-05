import { http } from "@/shared/api/http"
import type {
  CreateCustomerPurchaseDto,
  CustomerPurchaseFilters,
  CustomerPurchasePage,
  CustomerPurchaseView,
} from "../model/customer-purchase.types"

type QueryParams = Record<string, string | number | boolean | undefined | null>

export const customerPurchaseRepository = {
  list: (filters: CustomerPurchaseFilters): Promise<CustomerPurchasePage> =>
    http<CustomerPurchasePage>("/customer-purchases", { params: filters as QueryParams }),

  get: (id: string): Promise<CustomerPurchaseView> =>
    http<CustomerPurchaseView>(`/customer-purchases/${id}`),

  create: (dto: CreateCustomerPurchaseDto): Promise<CustomerPurchaseView> =>
    http<CustomerPurchaseView>("/customer-purchases", { method: "POST", body: dto }),
}
