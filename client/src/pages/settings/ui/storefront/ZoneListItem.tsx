import { Edit2, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { type StorefrontDeliveryZoneView } from "@/entities/storefront"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"

export function ZoneListItem({
  zone,
  disabled,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  zone: StorefrontDeliveryZoneView
  disabled: boolean
  onEdit: (zone: StorefrontDeliveryZoneView) => void
  onToggleActive: (zone: StorefrontDeliveryZoneView, isActive: boolean) => void
  onDelete: (zone: StorefrontDeliveryZoneView) => void
}) {
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{zone.name}</span>
          {!zone.isActive && (
            <span className="text-[10px] text-muted-foreground uppercase">
              ({t("common.inactive")})
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatMoney(Number(zone.fee))} so&apos;m
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={zone.isActive}
          onCheckedChange={(checked) => onToggleActive(zone, checked)}
          disabled={disabled}
        />
        {!disabled && (
          <>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onEdit(zone)}
              className="size-7"
            >
              <Edit2 className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onDelete(zone)}
              className="size-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
