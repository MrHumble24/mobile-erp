import * as React from "react"
import { Pencil, Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  useExpenseCategories,
  type ExpenseCategoryView,
} from "@/entities/expense-category"
import { ExpenseCategoryDialog } from "@/features/manage-expense-category"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

export function ExpensesCategoriesTab({ canManage }: { canManage: boolean }) {
  const { t } = useI18n()
  const { data: categories, isLoading } = useExpenseCategories()
  const [editing, setEditing] = React.useState<ExpenseCategoryView | null>(null)
  const [open, setOpen] = React.useState(false)

  const openDialog = (category: ExpenseCategoryView | null) => {
    setEditing(category)
    setOpen(true)
  }

  if (isLoading) return <Skeleton className="h-96 rounded-[16px]" />

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={() => openDialog(null)}>
            <Plus className="size-4" />
            {t("expenses.newCategory")}
          </Button>
        </div>
      )}
      <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("expenses.categoryName")}</TableHead>
              <TableHead>{t("expenses.sortOrder")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              {canManage && <TableHead className="text-right">{t("common.actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-sm">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "violet" : "outline"}>
                    {c.isActive ? t("expenses.categoryActive") : t("common.no")}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openDialog(c)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">{t("common.edit")}</span>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ExpenseCategoryDialog category={editing} open={open} onOpenChange={setOpen} />
    </div>
  )
}
