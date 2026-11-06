import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog"

export function ZoneEditDialog({
  open,
  onOpenChange,
  isEditing,
  name,
  setName,
  fee,
  setFee,
  onSave,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  name: string
  setName: (v: string) => void
  fee: string
  setFee: (v: string) => void
  onSave: () => void
  isPending: boolean
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("settings.editZone") : t("settings.addZone")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t("settings.zoneName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.zoneNamePlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t("settings.zoneFee")}</Label>
            <Input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="25000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={isPending || !name.trim() || !fee.trim()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
