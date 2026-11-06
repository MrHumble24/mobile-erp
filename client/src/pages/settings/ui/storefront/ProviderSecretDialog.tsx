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

export function ProviderSecretDialog({
  open,
  onOpenChange,
  secretInput,
  setSecretInput,
  onSave,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  secretInput: string
  setSecretInput: (v: string) => void
  onSave: () => void
  isPending: boolean
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.setSecret")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-xs font-semibold">{t("settings.secretKey")}</Label>
          <Input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="••••••••••••••••"
          />
          <p className="text-[11px] text-muted-foreground">{t("settings.secretNeverShownBack")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={isPending || !secretInput.trim()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
