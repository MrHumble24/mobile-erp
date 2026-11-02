import { http } from "@/shared/api/http"
import type {
  ConsignmentFilters,
  ConsignmentPage,
  ConsignmentView,
  CreateConsignmentDto,
  OverdueConsignment,
  ReturnConsignmentDto,
  SettleConsignmentDto,
} from "../model/consignment.types"

export const consignmentRepository = {
  list: async (filters?: ConsignmentFilters): Promise<ConsignmentPage> => {
    return http<ConsignmentPage>("/consignments", {
      params: filters as Record<string, string | number | boolean | undefined>,
    })
  },

  overdue: async (): Promise<OverdueConsignment[]> => {
    return http<OverdueConsignment[]>("/consignments/overdue")
  },

  get: async (id: string): Promise<ConsignmentView> => {
    return http<ConsignmentView>(`/consignments/${id}`)
  },

  create: async (dto: CreateConsignmentDto): Promise<ConsignmentView> => {
    return http<ConsignmentView>("/consignments", {
      method: "POST",
      body: dto,
    })
  },

  settle: async (
    id: string,
    dto: SettleConsignmentDto
  ): Promise<ConsignmentView> => {
    return http<ConsignmentView>(`/consignments/${id}/settle`, {
      method: "POST",
      body: dto,
    })
  },

  returnConsignment: async (
    id: string,
    dto: ReturnConsignmentDto
  ): Promise<ConsignmentView> => {
    return http<ConsignmentView>(`/consignments/${id}/return`, {
      method: "POST",
      body: dto,
    })
  },
}
