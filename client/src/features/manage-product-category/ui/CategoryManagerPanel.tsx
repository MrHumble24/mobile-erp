import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useProductCategories, type ProductCategoryView } from "@/entities/product-category"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { CategoryDialog } from "./CategoryDialog"

type DialogState = { open: boolean; category: ProductCategoryView | null }

export function CategoryManagerPanel() {
  const { t } = useI18n()
  const { data: categories, isLoading } = useProductCategories()
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, category: null })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("catalog.categories")}</h3>
        <Button size="sm" onClick={() => setDialog({ open: true, category: null })} className="gap-1.5">
          <Plus className="size-4" />
          {t("catalog.newCategory")}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (categories ?? []).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
          {t("inventory.empty")}
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("catalog.categoryName")}</TableHead>
                <TableHead>{t("catalog.sortOrder")}</TableHead>
                <TableHead>{t("inventory.modelActive")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((c) => (
                <TableRow key={c.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <TableCell className="font-medium text-[#202020]">{c.name}</TableCell>
                  <TableCell className="text-xs text-[#646464]">{c.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "mint" : "outline"} size="sm">
                      {c.isActive ? t("common.yes") : t("common.no")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ open: true, category: c })}
                      className="h-7 text-xs"
                    >
                      {t("common.edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryDialog
        category={dialog.category}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </div>
  )
}
