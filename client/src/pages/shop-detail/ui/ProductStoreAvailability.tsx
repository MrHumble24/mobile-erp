import { MapPin, Clock } from "lucide-react"
import { useI18n } from "@/shared/i18n"

export interface StoreAvailabilityItem {
  id: string
  name: string
  count?: number
}

export interface ProductStoreAvailabilityProps {
  stores: StoreAvailabilityItem[]
}

export function ProductStoreAvailability({ stores }: ProductStoreAvailabilityProps) {
  const { t } = useI18n()

  if (stores.length === 0) {
    return (
      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">
        {t("storefront.outOfStock")}
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-3 border-t border-border/80">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" />
          {t("storefront.availableBranches")}
        </span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
          <Clock className="size-3" />
          {t("storefront.pickupToday")}
        </span>
      </div>

      <div className="space-y-1.5">
        {stores.map((st) => (
          <div
            key={st.id}
            className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-muted/40 border border-border/70"
          >
            <span className="font-medium text-foreground flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {st.name}
            </span>
            {st.count !== undefined && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {st.count} {t("storefront.unitsCount")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

