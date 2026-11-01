import { http } from "@/shared/api/http"
import type {
  CreateInspectionDto,
  LookupView,
  QcInspectionView,
} from "../model/qc.types"

export const qcRepository = {
  createInspection: async (dto: CreateInspectionDto): Promise<QcInspectionView> => {
    return http<QcInspectionView>("/qc/inspections", {
      method: "POST",
      body: dto,
    })
  },

  list: async (deviceId?: string): Promise<QcInspectionView[]> => {
    return http<QcInspectionView[]>("/qc/inspections", {
      params: { deviceId },
    })
  },

  listDefectTypes: async (): Promise<LookupView[]> => {
    return http<LookupView[]>("/qc/defect-types")
  },

  listGrades: async (): Promise<LookupView[]> => {
    return http<LookupView[]>("/qc/grades")
  },
}
