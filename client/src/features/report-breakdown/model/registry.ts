import type { ReactNode } from "react"
import type { BreakdownKind, BreakdownProps } from "./breakdown.types"
import { SalesLinesBreakdown } from "../ui/SalesLinesBreakdown"
import { ModelMeasureBreakdown } from "../ui/ModelMeasureBreakdown"
import { ExpensesListBreakdown } from "../ui/ExpensesListBreakdown"
import { ReturnsListBreakdown } from "../ui/ReturnsListBreakdown"
import { NoiBreakdown } from "../ui/NoiBreakdown"
import { PartnerBreakdown } from "../ui/PartnerBreakdown"
import { InventoryModelBreakdown } from "../ui/InventoryModelBreakdown"

export interface BreakdownEntry {
  titleKey: string
  Component: (props: BreakdownProps) => ReactNode
}

/** kind → title + component. Add a breakdown by adding one entry here. */
export const BREAKDOWN_REGISTRY: Record<BreakdownKind, BreakdownEntry> = {
  revenue: { titleKey: "reports.brkRevenue", Component: SalesLinesBreakdown },
  cogs: { titleKey: "reports.brkCogs", Component: SalesLinesBreakdown },
  salesByModel: { titleKey: "reports.brkSalesByModel", Component: SalesLinesBreakdown },
  grossProfit: { titleKey: "reports.brkGrossProfit", Component: ModelMeasureBreakdown },
  units: { titleKey: "reports.brkUnits", Component: ModelMeasureBreakdown },
  expenses: { titleKey: "reports.brkExpenses", Component: ExpensesListBreakdown },
  expenseCategory: { titleKey: "reports.brkExpenseCategory", Component: ExpensesListBreakdown },
  returns: { titleKey: "reports.brkReturns", Component: ReturnsListBreakdown },
  noi: { titleKey: "reports.brkNoi", Component: NoiBreakdown },
  partner: { titleKey: "reports.brkPartner", Component: PartnerBreakdown },
  inventoryModel: { titleKey: "reports.brkInventoryModel", Component: InventoryModelBreakdown },
}
