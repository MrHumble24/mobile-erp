import { Sparkles, RefreshCw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { usePwaUpdate } from "../model/use-pwa-update"

export function PwaUpdateToast() {
  const { t } = useI18n()
  const { needRefresh, updateApp } = usePwaUpdate()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {t("pwa.updateAvailable")}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              {t("pwa.updateDescription")}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => updateApp()}
          className="h-8 px-3 rounded-lg text-xs font-semibold shrink-0 gap-1.5"
        >
          <RefreshCw className="size-3" />
          {t("pwa.updateNow")}
        </Button>
      </div>
    </div>
  )
}

