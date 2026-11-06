import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
  type StorefrontDeliveryZoneView,
} from "@/entities/storefront"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"
import { ZoneListItem } from "./ZoneListItem"
import { ZoneEditDialog } from "./ZoneEditDialog"

export function DeliveryZonesManager({ disabled }: { disabled: boolean }) {
  const { t } = useI18n()
  const { data: zones } = useDeliveryZones()
  const createZone = useCreateDeliveryZone()
  const updateZone = useUpdateDeliveryZone()
  const deleteZone = useDeleteDeliveryZone()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingZone, setEditingZone] =
    React.useState<StorefrontDeliveryZoneView | null>(null)
  const [name, setName] = React.useState("")
  const [fee, setFee] = React.useState("")

  const openCreate = () => {
    setEditingZone(null)
    setName("")
    setFee("")
    setDialogOpen(true)
  }

  const openEdit = (zone: StorefrontDeliveryZoneView) => {
    setEditingZone(zone)
    setName(zone.name)
    setFee(zone.fee)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!name.trim() || !fee.trim()) return
    const feeNum = Number(fee)
    if (isNaN(feeNum) || feeNum < 0) return

    if (editingZone) {
      updateZone.mutate(
        { id: editingZone.id, dto: { name: name.trim(), fee: feeNum } },
        {
          onSuccess: () => {
            toast.success(t("settings.zoneSaved"))
            setDialogOpen(false)
          },
          onError: () => toast.error(t("common.error")),
        },
      )
    } else {
      createZone.mutate(
        { name: name.trim(), fee: feeNum },
        {
          onSuccess: () => {
            toast.success(t("settings.zoneCreated"))
            setDialogOpen(false)
          },
          onError: () => toast.error(t("common.error")),
        },
      )
    }
  }

  const handleDelete = (zone: StorefrontDeliveryZoneView) => {
    if (!window.confirm(t("settings.confirmDeleteZone", { name: zone.name }))) return
    deleteZone.mutate(zone.id, {
      onSuccess: () => toast.success(t("settings.zoneDeleted")),
      onError: (err: unknown) => {
        const message = (err as { message?: string })?.message || t("settings.zoneInUse")
        toast.error(message)
      },
    })
  }

  const handleToggleActive = (zone: StorefrontDeliveryZoneView, isActive: boolean) => {
    updateZone.mutate({ id: zone.id, dto: { isActive } })
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{t("settings.deliveryZones")}</Label>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openCreate}
            className="h-7 text-xs gap-1"
          >
            <Plus className="size-3" />
            <span>{t("settings.addZone")}</span>
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {zones && zones.length > 0 ? (
          zones.map((zone) => (
            <ZoneListItem
              key={zone.id}
              zone={zone}
              disabled={disabled}
              onEdit={openEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground py-2 text-center">
            {t("settings.noDeliveryZones")}
          </p>
        )}
      </div>

      <ZoneEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={!!editingZone}
        name={name}
        setName={setName}
        fee={fee}
        setFee={setFee}
        onSave={handleSave}
        isPending={createZone.isPending || updateZone.isPending}
      />
    </div>
  )
}
