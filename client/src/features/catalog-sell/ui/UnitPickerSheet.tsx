import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import type { CatalogEntry, CatalogUnit } from "@/entities/catalog"

export interface UnitPickerSheetProps {
  open: boolean
  entry: CatalogEntry | null
  units: CatalogUnit[]
  onClose: () => void
  onPick: (unit: CatalogUnit) => void
}

function spec(unit: CatalogUnit, key: string): string | null {
  const v = unit.specs?.[key]
  return v == null || v === "" ? null : String(v)
}

/** Lists the in-stock units of a product so the seller picks the one to sell. */
export function UnitPickerSheet({ open, entry, units, onClose, onPick }: UnitPickerSheetProps) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("catalog.pickUnit")}</SheetTitle>
          <SheetDescription>{entry ? `${entry.brand} ${entry.name}` : ""}</SheetDescription>
        </SheetHeader>
        <div className="my-4 space-y-2 overflow-y-auto">
          {units.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("catalog.noUnits")}</p>
          )}
          {units.map((u) => {
            const facts = [spec(u, "storage"), spec(u, "color")].filter(Boolean).join(" · ")
            return (
              <Button
                key={u.id}
                type="button"
                variant="outline"
                onClick={() => onPick(u)}
                className="flex h-auto w-full items-center justify-between gap-2 whitespace-normal rounded-[12px] px-3 py-2.5 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{u.code}</span>
                  {facts && <span className="block text-xs text-muted-foreground">{facts}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {u.gradeCode && <Badge variant="outline" size="sm">{u.gradeCode}</Badge>}
                  <span className="text-sm font-bold text-primary">{formatMoney(u.targetPrice)}</span>
                </span>
              </Button>
            )
          })}
        </div>
      </SheetPopup>
    </Sheet>
  )
}
