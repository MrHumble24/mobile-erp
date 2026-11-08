import { Download, Check } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { usePwaInstall } from "../model/use-pwa-install"
import { PwaIosDialog } from "./PwaIosDialog"

export interface PwaInstallButtonProps {
  className?: string
  variant?: "outline" | "default" | "ghost" | "secondary"
  size?: "default" | "sm" | "icon"
  showInstalled?: boolean
}

export function PwaInstallButton({
  className,
  variant = "outline",
  size = "sm",
  showInstalled = false,
}: PwaInstallButtonProps) {
  const { t } = useI18n()
  const { isInstallable, isStandalone, isInstalled, showIosGuide, setShowIosGuide, install } =
    usePwaInstall()

  if (isStandalone || isInstalled) {
    if (!showInstalled) return null
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium px-2 py-1">
        <Check className="size-3 text-emerald-500" />
        {t("pwa.installed")}
      </span>
    )
  }

  if (!isInstallable) return null

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => install()}
        className={cn("gap-1.5 text-xs font-semibold rounded-lg", className)}
        title={t("pwa.installTitle")}
      >
        <Download className="size-3.5" />
        <span>{t("pwa.install")}</span>
      </Button>

      <PwaIosDialog open={showIosGuide} onClose={() => setShowIosGuide(false)} />
    </>
  )
}

