import { Share, PlusSquare, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"

export interface PwaIosDialogProps {
  open: boolean
  onClose: () => void
}

function IosStepsList() {
  const { t } = useI18n()

  return (
    <div className="space-y-3 rounded-xl bg-muted/50 border border-border/60 p-3.5 text-xs">
      <div className="flex items-center gap-3">
        <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 text-primary">
          <Share className="size-3.5" />
        </div>
        <span className="text-foreground leading-tight">
          1. {t("pwa.iosInstallStep1")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 text-primary">
          <PlusSquare className="size-3.5" />
        </div>
        <span className="text-foreground leading-tight">
          2. {t("pwa.iosInstallStep2")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 text-emerald-600 font-semibold">
          3
        </div>
        <span className="text-foreground leading-tight">
          3. {t("pwa.iosInstallStep3")}
        </span>
      </div>
    </div>
  )
}

export function PwaIosDialog({ open, onClose }: PwaIosDialogProps) {
  const { t } = useI18n()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 z-10 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground tracking-tight">
              {t("pwa.iosInstallTitle")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("pwa.installDescription")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
          >
            <X className="size-4" />
          </Button>
        </div>

        <IosStepsList />

        <Button
          type="button"
          onClick={onClose}
          className="w-full h-9 rounded-xl text-xs font-semibold"
        >
          {t("pwa.dismiss")}
        </Button>
      </div>
    </div>
  )
}
