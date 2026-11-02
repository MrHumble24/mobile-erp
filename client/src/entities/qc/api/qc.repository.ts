import { http } from "@/shared/api/http"
import type {
  CreateInspectionDto,
  CreateLookupDto,
  InspectionFilters,
  LookupView,
  PaginatedInspections,
  QcInspectionView,
  QcStatsView,
  StatsRange,
  UpdateLookupDto,
} from "../model/qc.types"

type Params = Record<string, string | number | boolean | undefined | null>

export const qcRepository = {
  createInspection: async (dto: CreateInspectionDto): Promise<QcInspectionView> => {
    return http<QcInspectionView>("/qc/inspections", { method: "POST", body: dto })
  },

  listInspections: async (filters?: InspectionFilters): Promise<PaginatedInspections> => {
    return http<PaginatedInspections>("/qc/inspections", { params: filters as Params })
  },

  stats: async (range?: StatsRange): Promise<QcStatsView> => {
    return http<QcStatsView>("/qc/stats", { params: range as Params })
  },

  listDefectTypes: async (includeInactive?: boolean): Promise<LookupView[]> => {
    return http<LookupView[]>("/qc/defect-types", { params: { includeInactive } })
  },

  listGrades: async (includeInactive?: boolean): Promise<LookupView[]> => {
    return http<LookupView[]>("/qc/grades", { params: { includeInactive } })
  },

  createDefectType: async (dto: CreateLookupDto): Promise<LookupView> => {
    return http<LookupView>("/qc/defect-types", { method: "POST", body: dto })
  },

  updateDefectType: async (code: string, dto: UpdateLookupDto): Promise<LookupView> => {
    return http<LookupView>(`/qc/defect-types/${code}`, { method: "PATCH", body: dto })
  },

  createGrade: async (dto: CreateLookupDto): Promise<LookupView> => {
    return http<LookupView>("/qc/grades", { method: "POST", body: dto })
  },

  updateGrade: async (code: string, dto: UpdateLookupDto): Promise<LookupView> => {
    return http<LookupView>(`/qc/grades/${code}`, { method: "PATCH", body: dto })
  },
}
