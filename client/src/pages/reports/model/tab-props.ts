import type { BreakdownRequest } from "@/features/report-breakdown"
import type { ReportRange } from "./use-report-range"

export interface ReportTabProps {
  range: ReportRange
  onBreakdown: (req: BreakdownRequest) => void
  canViewCost: boolean
}
