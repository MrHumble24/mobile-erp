import * as React from "react"
import { Plus, Search } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  useDeviceModels,
  productKindLabelKey,
  type DeviceModelView,
} from "@/entities/device-model"
import { useProductCategories } from "@/entities/product-category"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { AssetImage } from "@/shared/ui/asset-image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { DeviceModelDialog } from "./DeviceModelDialog"

type DialogState = { open: boolean; model: DeviceModelView | null }

const ALL_CATEGORIES = "__all__"

function ModelsTable({
  models,
  categoryName,
  onEdit,
}: {
  models: DeviceModelView[]
  categoryName: (id: string | null) => string
  onEdit: (m: DeviceModelView) => void
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">{t("catalog.picture")}</TableHead>
            <TableHead>{t("inventory.brand")}</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("catalog.productKind")}</TableHead>
            <TableHead>{t("catalog.category")}</TableHead>
            <TableHead>{t("inventory.modelActive")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((m) => (
            <TableRow key={m.id} className="hover:bg-[#f8f9fa] transition-colors">
              <TableCell>
                <AssetImage
                  path={m.imageUrl}
                  alt={m.name}
                  className="size-10 rounded-[8px] border border-[#e8e8e8]"
                  iconClassName="size-4"
                />
              </TableCell>
              <TableCell className="font-semibold text-[#090c1d]">{m.brand}</TableCell>
              <TableCell className="font-medium text-[#202020]">{m.name}</TableCell>
              <TableCell>
                <Badge variant="outline" size="sm">{t(productKindLabelKey(m.kindCode))}</Badge>
              </TableCell>
              <TableCell className="text-xs text-[#646464]">{categoryName(m.categoryId)}</TableCell>
              <TableCell>
                <Badge variant={m.isActive ? "mint" : "outline"} size="sm">
                  {m.isActive ? t("common.yes") : t("common.no")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(m)} className="h-7 text-xs">
                  {t("common.edit")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  const { data: categories } = useProductCategories()
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? ALL_CATEGORIES)}>
      <SelectTrigger className="h-9 w-full sm:w-52 bg-white border-[#e8e8e8] shadow-[var(--shadow-xs)]">
        <SelectValue placeholder={t("catalog.allCategories")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>{t("catalog.allCategories")}</SelectItem>
        {(categories ?? []).map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DeviceModelsPanel() {
  const { t } = useI18n()
  const { data: models, isLoading } = useDeviceModels()
  const { data: categories } = useProductCategories()
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, model: null })
  const [search, setSearch] = React.useState("")
  const [categoryId, setCategoryId] = React.useState(ALL_CATEGORIES)

  const categoryName = React.useCallback(
    (id: string | null) => (categories ?? []).find((c) => c.id === id)?.name ?? t("catalog.noCategory"),
    [categories, t]
  )

  const filtered = React.useMemo(() => {
    if (!models) return []
    const q = search.trim().toLowerCase()
    return models.filter((m) => {
      if (categoryId !== ALL_CATEGORIES && m.categoryId !== categoryId) return false
      if (q && !`${m.brand} ${m.name}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [models, search, categoryId])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#838383]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t("inventory.brand")} / ${t("inventory.model")}...`}
              className="pl-9 h-9 bg-white border-[#e8e8e8] shadow-[var(--shadow-xs)]"
            />
          </div>
          <CategoryFilter value={categoryId} onChange={setCategoryId} />
        </div>
        <Button size="sm" onClick={() => setDialog({ open: true, model: null })} className="gap-1.5 shrink-0">
          <Plus className="size-4" />
          {t("inventory.newModel")}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
          {t("inventory.empty")}
        </div>
      ) : (
        <ModelsTable models={filtered} categoryName={categoryName} onEdit={(m) => setDialog({ open: true, model: m })} />
      )}

      <DeviceModelDialog
        model={dialog.model}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </div>
  )
}
