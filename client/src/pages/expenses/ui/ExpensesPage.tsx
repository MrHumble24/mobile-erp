import * as React from "react"
import { Download, Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useExpenses, type ExpenseView } from "@/entities/expense"
import { LogExpenseDialog } from "@/features/log-expense"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { useExpenseFilters } from "../model/use-expense-filters"
import { exportExpensesCsv } from "../lib/expenses-csv"
import { ExpensesListTab } from "./ExpensesListTab"
import { ExpenseDetailSheet } from "./ExpenseDetailSheet"
import { ExpensesCategoriesTab } from "./ExpensesCategoriesTab"
import { ExpenseRecurringTab } from "./ExpenseRecurringTab"

const EXPENSE_TABS = ["expenses", "categories", "recurring"] as const
type ExpenseTab = (typeof EXPENSE_TABS)[number]

function useExpenseDialogs() {
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<ExpenseView | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  return { detailId, setDetailId, editing, setEditing, formOpen, setFormOpen }
}

export function ExpensesPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<ExpenseTab>("expenses", { validTabs: EXPENSE_TABS })
  const canManage = useAuthStore((s) => s.hasPermission("expense.manage"))
  const canReadUsers = useAuthStore((s) => s.hasPermission("user.read"))

  const filters = useExpenseFilters()
  const { data, isLoading } = useExpenses(filters.queryFilters)
  const d = useExpenseDialogs()

  const openNew = () => {
    d.setEditing(null)
    d.setFormOpen(true)
  }
  const openEdit = (expense: ExpenseView) => {
    d.setDetailId(null)
    d.setEditing(expense)
    d.setFormOpen(true)
  }

  const rowActions = { onDetail: (e: ExpenseView) => d.setDetailId(e.id), onEdit: openEdit }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("expenses.title")}
        description={t("expenses.pageDescription")}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportExpensesCsv(data.items)}
            >
              <Download className="size-4" />
              {t("expenses.exportCsv")}
            </Button>
            {canManage && (
              <Button size="sm" className="gap-1.5" onClick={openNew}>
                <Plus className="size-4" />
                {t("expenses.newExpense")}
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ExpenseTab)}>
        <TabsList>
          <TabsTrigger value="expenses">{t("expenses.tabExpenses")}</TabsTrigger>
          <TabsTrigger value="categories">{t("expenses.tabCategories")}</TabsTrigger>
          <TabsTrigger value="recurring">{t("expenses.tabRecurring")}</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <ExpensesListTab
            filters={filters}
            data={data}
            isLoading={isLoading}
            canManage={canManage}
            canReadUsers={canReadUsers}
            actions={rowActions}
          />
        </TabsContent>
        <TabsContent value="categories">
          <ExpensesCategoriesTab canManage={canManage} />
        </TabsContent>
        <TabsContent value="recurring">
          <ExpenseRecurringTab canManage={canManage} />
        </TabsContent>
      </Tabs>

      <ExpenseDetailSheet
        expenseId={d.detailId}
        open={Boolean(d.detailId)}
        onClose={() => d.setDetailId(null)}
        canManage={canManage}
        onEdit={openEdit}
      />
      <LogExpenseDialog
        expense={d.editing}
        open={d.formOpen}
        onOpenChange={d.setFormOpen}
      />
    </div>
  )
}
