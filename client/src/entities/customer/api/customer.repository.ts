import { http } from "@/shared/api/http"
import type {
  CreateCustomerDto,
  CustomerListFilters,
  CustomerListItem,
  CustomerPage,
  CustomerSaleView,
  CustomerStats,
  CustomerView,
  UpdateCustomerDto,
} from "../model/customer.types"

export const customerRepository = {
  /** Lightweight typeahead for POS checkout (name/phone match, top 10). */
  lookup: async (q?: string): Promise<CustomerView[]> => {
    return http<CustomerView[]>("/customers/lookup", { params: { q } })
  },

  page: async (filters: CustomerListFilters): Promise<CustomerPage> => {
    return http<CustomerPage>("/customers", {
      params: {
        search: filters.search,
        hasPurchases:
          filters.hasPurchases === undefined ? undefined : String(filters.hasPurchases),
        sort: filters.sort,
        page: filters.page,
        pageSize: filters.pageSize,
      },
    })
  },

  stats: async (): Promise<CustomerStats> => {
    return http<CustomerStats>("/customers/stats")
  },

  get: async (id: string): Promise<CustomerListItem> => {
    return http<CustomerListItem>(`/customers/${id}`)
  },

  getSales: async (id: string): Promise<CustomerSaleView[]> => {
    return http<CustomerSaleView[]>(`/customers/${id}/sales`)
  },

  create: async (dto: CreateCustomerDto): Promise<CustomerView> => {
    return http<CustomerView>("/customers", { method: "POST", body: dto })
  },

  update: async (id: string, dto: UpdateCustomerDto): Promise<CustomerView> => {
    return http<CustomerView>(`/customers/${id}`, { method: "PATCH", body: dto })
  },
}
