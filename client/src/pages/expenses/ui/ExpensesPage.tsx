import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useExpenses, type ExpenseFilters } from "@/entities/expense"
import { useExpenseCategories } from "@/entities/expense-category"
import { LogExpenseDialog } from "@/features/log-expense"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { ExpensesSummaryCard } from "./ExpensesSummaryCard"
import { ExpensesTable } from "./ExpensesTable"

function CategoryFilterSelect({
  value,
  onChange,
}: {
  value?: string
  onChange: (v?: string) => void
}) {
  const { t } = useI18n()
  const { data: categories } = useExpenseCategories()

  return (
    <div className="w-48">
      <Select
        value={value || "all"}
        onValueChange={(val) => onChange(val === "all" ? undefined : val || undefined)}
      >
        <SelectTrigger className="h-9 rounded-[9px]">
          <SelectValue placeholder={t("expenses.category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          {categories?.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function RecurringFilterSelect({
  value,
  onChange,
}: {
  value?: boolean
  onChange: (v?: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <div className="w-48">
      <Select
        value={value === undefined ? "all" : value ? "recurring" : "one-off"}
        onValueChange={(val) =>
          onChange(val === "all" ? undefined : val === "recurring")
        }
      >
        <SelectTrigger className="h-9 rounded-[9px]">
          <SelectValue placeholder={t("expenses.isRecurring")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="recurring">{t("expenses.isRecurring")}</SelectItem>
          <SelectItem value="one-off">Bir martalik</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function ExpensesPage() {
  const { t } = useI18n()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [categoryId, setCategoryId] = React.useState<string | undefined>()
  const [isRecurring, setIsRecurring] = React.useState<boolean | undefined>()

  const filters: ExpenseFilters = React.useMemo(
    () => ({ categoryId, isRecurring }),
    [categoryId, isRecurring]
  )
  const { data: expensePage, isLoading } = useExpenses(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("expenses.title")}
        description="Do'kon operatsion xarajatlari, ijara, oylik maoshlar va to'lovlar hisobi"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs">
            <Plus className="size-4" />
            {t("expenses.newExpense")}
          </Button>
        }
      />

      <ExpensesSummaryCard />

      <div className="flex flex-wrap items-center gap-3">
        <CategoryFilterSelect value={categoryId} onChange={setCategoryId} />
        <RecurringFilterSelect value={isRecurring} onChange={setIsRecurring} />
      </div>

      {isLoading && (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      )}

      {expensePage && <ExpensesTable expenses={expensePage.items} />}

      <LogExpenseDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
