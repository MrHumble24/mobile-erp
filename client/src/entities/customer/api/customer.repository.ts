import { http } from "@/shared/api/http"
import type {
  CreateCustomerDto,
  CustomerSaleView,
  CustomerView,
  UpdateCustomerDto,
} from "../model/customer.types"

export const customerRepository = {
  list: async (q?: string): Promise<CustomerView[]> => {
    return http<CustomerView[]>("/customers", {
      params: { q },
    })
  },

  get: async (id: string): Promise<CustomerView> => {
    return http<CustomerView>(`/customers/${id}`)
  },

  getSales: async (id: string): Promise<CustomerSaleView[]> => {
    return http<CustomerSaleView[]>(`/customers/${id}/sales`)
  },

  create: async (dto: CreateCustomerDto): Promise<CustomerView> => {
    return http<CustomerView>("/customers", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdateCustomerDto): Promise<CustomerView> => {
    return http<CustomerView>(`/customers/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },
}
