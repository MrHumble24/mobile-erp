export interface RangeParams {
  from?: string
  to?: string
}

/**
 * Discriminated request for the Breakdown Sheet. Add a breakdown by adding a
 * variant here, a component, and one registry entry — never a switch chain.
 */
export type BreakdownRequest =
  | ({ kind: "revenue" } & RangeParams)
  | ({ kind: "cogs" } & RangeParams)
  | ({ kind: "grossProfit" } & RangeParams)
  | ({ kind: "expenses" } & RangeParams)
  | ({ kind: "noi" } & RangeParams)
  | ({ kind: "returns" } & RangeParams)
  | ({ kind: "units" } & RangeParams)
  | ({ kind: "salesByModel"; modelId: string; label: string } & RangeParams)
  | ({ kind: "expenseCategory"; categoryId: string; label: string } & RangeParams)
  | { kind: "partner"; partnerId: string; shopName: string }
  | { kind: "inventoryModel"; modelId: string; label: string }

export type BreakdownKind = BreakdownRequest["kind"]

export interface BreakdownProps {
  request: BreakdownRequest
  /** Swap the sheet to another breakdown (e.g. NOI terms). */
  onOpen: (req: BreakdownRequest) => void
  /** Navigate away (page supplies react-router's navigate). */
  onNavigate: (path: string) => void
  /** device.cost.view — gates COGS/landed-cost columns. */
  canViewCost: boolean
}
