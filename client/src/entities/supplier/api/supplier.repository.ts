import { http } from "@/shared/api/http"
import type {
  CreateSupplierDto,
  SupplierView,
  UpdateSupplierDto,
} from "../model/supplier.types"

export const supplierRepository = {
  list: async (): Promise<SupplierView[]> => {
    return http<SupplierView[]>("/suppliers")
  },

  get: async (id: string): Promise<SupplierView> => {
    return http<SupplierView>(`/suppliers/${id}`)
  },

  create: async (dto: CreateSupplierDto): Promise<SupplierView> => {
    return http<SupplierView>("/suppliers", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdateSupplierDto): Promise<SupplierView> => {
    return http<SupplierView>(`/suppliers/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },
}
