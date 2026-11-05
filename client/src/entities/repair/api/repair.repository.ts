import { http } from "@/shared/api/http"
import type {
  AddPartDto,
  ChangeStatusDto,
  CreateRepairDto,
  RepairListFilters,
  RepairMoneyDto,
  RepairPage,
  RepairReport,
  RepairReportFilters,
  RepairView,
  UpdateRepairDto,
} from "../model/repair.types"

export const repairRepository = {
  list: (filters: RepairListFilters): Promise<RepairPage> =>
    http<RepairPage>("/repairs", {
      params: {
        status: filters.status,
        from: filters.from,
        to: filters.to,
        customerId: filters.customerId,
        search: filters.search,
        page: filters.page,
        pageSize: filters.pageSize,
      },
    }),

  get: (id: string): Promise<RepairView> => http<RepairView>(`/repairs/${id}`),

  report: (filters: RepairReportFilters): Promise<RepairReport> =>
    http<RepairReport>("/repairs/report", {
      params: { from: filters.from, to: filters.to },
    }),

  create: (dto: CreateRepairDto): Promise<RepairView> =>
    http<RepairView>("/repairs", { method: "POST", body: dto }),

  update: (id: string, dto: UpdateRepairDto): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}`, { method: "PATCH", body: dto }),

  changeStatus: (id: string, dto: ChangeStatusDto): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}/status`, { method: "POST", body: dto }),

  addPart: (id: string, dto: AddPartDto): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}/parts`, { method: "POST", body: dto }),

  removePart: (id: string, partId: string): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}/parts/${partId}`, { method: "DELETE" }),

  addPayment: (id: string, dto: RepairMoneyDto): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}/payments`, { method: "POST", body: dto }),

  refund: (id: string, dto: RepairMoneyDto): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}/refund`, { method: "POST", body: dto }),

  outsidePayment: (id: string, dto: RepairMoneyDto): Promise<RepairView> =>
    http<RepairView>(`/repairs/${id}/outside-payment`, { method: "POST", body: dto }),
}
