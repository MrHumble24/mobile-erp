import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useI18n } from "@/shared/i18n"
import { catalogKeys } from "@/entities/catalog"
import { deviceKeys } from "@/entities/device"
import type { DeviceModelView } from "@/entities/device-model"
import {
  usePriceLevels,
  useProductPrices,
  useSetProductPrices,
  type PutProductPricesDto,
} from "@/entities/pricing"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

type Cells = Record<string, string>

const ANY = "" // the any-storage row key

function cellKey(storage: string, levelCode: string): string {
  return `${storage}|${levelCode}`
}

/** Storage options for the grid rows: the "any" row first, then the model's storages. */
function storageRows(model: DeviceModelView): string[] {
  if (model.kindCode === "QUANTITY") return [ANY]
  const storage = model.attributes.find((a) => a.key === "storage")
  return [ANY, ...(storage?.options ?? [])]
}

function levelLabel(code: string, t: (k: string) => string, fallback: string): string {
  if (code === "RETAIL") return t("pricing.levelRetail")
  if (code === "WHOLESALE") return t("pricing.levelWholesale")
  if (code === "PARTNER") return t("pricing.levelPartner")
  return fallback
}

/**
 * The storage × level price grid for a product (ADR 0034, `price.manage`).
 * A quantity product has only the "any storage" row. Saved in one PUT; a blank
 * cell clears that price.
 */
export function ProductPriceGrid({ model }: { model: DeviceModelView }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { data: levels } = usePriceLevels()
  const { data: current } = useProductPrices(model.id)
  const save = useSetProductPrices(model.id)
  const rows = storageRows(model)

  const [cells, setCells] = React.useState<Cells>({})
  React.useEffect(() => {
    if (!current) return
    const next: Cells = {}
    for (const p of current.prices) next[cellKey(p.storage ?? ANY, p.levelCode)] = String(Number(p.price))
    setCells(next)
  }, [current])

  if (!levels) return null
  const set = (storage: string, level: string, value: string) =>
    setCells((c) => ({ ...c, [cellKey(storage, level)]: value }))

  const handleSave = () => {
    const prices: PutProductPricesDto["prices"] = []
    for (const storage of rows) {
      for (const level of levels) {
        const raw = cells[cellKey(storage, level.code)]
        prices.push({
          storage: storage === ANY ? null : storage,
          levelCode: level.code,
          price: raw && raw.trim() !== "" ? Number(raw) : null,
        })
      }
    }
    save.mutate({ prices }, {
      onSuccess: () => {
        toast.success(t("pricing.pricesSaved"))
        queryClient.invalidateQueries({ queryKey: catalogKeys.all })
        queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <div className="space-y-3 rounded-[12px] border border-border bg-muted p-3">
      <div>
        <Label className="text-sm font-semibold">{t("pricing.productPrices")}</Label>
        <p className="text-xs text-muted-foreground">{t("pricing.productPricesHint")}</p>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,1fr))] gap-2 text-[11px] font-medium text-muted-foreground">
          <span>{t("pricing.storage")}</span>
          {levels.map((l) => (
            <span key={l.code}>{levelLabel(l.code, t, l.label)}</span>
          ))}
        </div>
        {rows.map((storage) => (
          <div key={storage || "any"} className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,1fr))] items-center gap-2">
            <span className="truncate text-xs font-medium">
              {storage === ANY ? t("pricing.anyStorage") : storage}
            </span>
            {levels.map((l) => (
              <Input
                key={l.code}
                type="number"
                min={0}
                className="h-9"
                value={cells[cellKey(storage, l.code)] ?? ""}
                onChange={(e) => set(storage, l.code, e.target.value)}
              />
            ))}
          </div>
        ))}
      </div>
      <Button type="button" size="sm" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </div>
  )
}
