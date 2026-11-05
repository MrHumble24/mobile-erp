import { http } from "@/shared/api/http"
import type {
  CloseShiftDto,
  ForceCloseShiftDto,
  OpenShiftDto,
  ShiftListFilters,
  ShiftListResult,
  ShiftReportView,
} from "../model/shift.types"

export const shiftRepository = {
  /** My open shift with live figures, or null (`sale.create`). */
  current: (): Promise<ShiftReportView | null> =>
    http<ShiftReportView | null>("/shifts/current"),

  list: (filters: ShiftListFilters): Promise<ShiftListResult> =>
    http<ShiftListResult>("/shifts", {
      params: {
        cashierId: filters.cashierId,
        from: filters.from,
        to: filters.to,
        page: filters.page,
        pageSize: filters.pageSize,
      },
    }),

  report: (id: string): Promise<ShiftReportView> =>
    http<ShiftReportView>(`/shifts/${id}/report`),

  open: (dto: OpenShiftDto): Promise<ShiftReportView> =>
    http<ShiftReportView>("/shifts/open", { method: "POST", body: dto }),

  close: (dto: CloseShiftDto): Promise<ShiftReportView> =>
    http<ShiftReportView>("/shifts/close", { method: "POST", body: dto }),

  forceClose: (id: string, dto: ForceCloseShiftDto): Promise<ShiftReportView> =>
    http<ShiftReportView>(`/shifts/${id}/force-close`, { method: "POST", body: dto }),
}
