import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { catalogKeys } from "@/entities/catalog"
import { deviceKeys, type DeviceDetailView } from "@/entities/device"
import {
  usePriceLevels,
  useUnitPrices,
  useSetUnitPrices,
  type PutUnitPricesDto,
} from "@/entities/pricing"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function levelLabel(code: string, t: (k: string) => string, fallback: string): string {
  if (code === "RETAIL") return t("pricing.levelRetail")
  if (code === "WHOLESALE") return t("pricing.levelWholesale")
  if (code === "PARTNER") return t("pricing.levelPartner")
  return fallback
}

/**
 * A unit's own prices (ADR 0034, `price.manage`): one field per level, empty
 * meaning "use the product price", with the resolved price shown beside each.
 */
export function UnitPriceSection({ device }: { device: DeviceDetailView }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { data: levels } = usePriceLevels()
  const { data: current } = useUnitPrices(device.id)
  const save = useSetUnitPrices(device.id)

  const [cells, setCells] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    if (!current) return
    const next: Record<string, string> = {}
    for (const p of current.prices) next[p.levelCode] = String(Number(p.price))
    setCells(next)
  }, [current])

  if (!levels) return null
  const resolved = device.prices

  const handleSave = () => {
    const prices: PutUnitPricesDto["prices"] = levels.map((l) => {
      const raw = cells[l.code]
      return { levelCode: l.code, price: raw && raw.trim() !== "" ? Number(raw) : null }
    })
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
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">{t("pricing.unitPrices")}</h4>
        <p className="text-xs text-muted-foreground">{t("pricing.unitPricesHint")}</p>
      </div>
      <div className="space-y-2">
        {levels.map((l) => {
          const res = resolved?.[l.code as keyof typeof resolved]
          return (
            <div key={l.code} className="flex items-center gap-3">
              <Label className="w-24 shrink-0 text-xs">{levelLabel(l.code, t, l.label)}</Label>
              <Input
                type="number"
                min={0}
                className="h-9 flex-1"
                value={cells[l.code] ?? ""}
                onChange={(e) => setCells((c) => ({ ...c, [l.code]: e.target.value }))}
              />
              <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                {res == null ? t("pricing.noPrice") : formatMoney(res)}
              </span>
            </div>
          )
        })}
      </div>
      <Button type="button" size="sm" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </div>
  )
}
