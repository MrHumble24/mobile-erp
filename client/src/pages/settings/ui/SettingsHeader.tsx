import { useI18n } from "@/shared/i18n"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import type { SettingsCategoryMeta } from "../model/settings-categories"

export interface SettingsHeaderProps {
  category: SettingsCategoryMeta
  isDirty?: boolean
  isPending?: boolean
  onSave?: () => void
  canManage: boolean
  onBackMobile?: () => void
  showBackMobile?: boolean
  lastUpdated?: string
  className?: string
}

export function SettingsHeader({
  category,
  isDirty,
  isPending,
  onSave,
  canManage,
  onBackMobile,
  showBackMobile,
  lastUpdated,
  className,
}: SettingsHeaderProps) {
  const { t } = useI18n()
  const Icon = category.icon

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60",
        className,
      )}
    >
      <div className="space-y-1 min-w-0">
        {showBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden inline-flex items-center gap-1.5 text-xs text-primary font-semibold mb-2 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            {t("settings.backToSettings")}
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg border border-border/70 bg-muted/40 flex items-center justify-center shrink-0 text-foreground shadow-2xs">
            <Icon className="size-4 text-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground tracking-tight truncate">
              {t(category.titleKey)}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {t(category.descKey)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {lastUpdated && (
          <span className="hidden lg:inline text-[11px] text-muted-foreground">
            {t("settings.lastUpdated")}: {lastUpdated}
          </span>
        )}

        {canManage && isDirty && (
          <Badge variant="violet" className="text-[11px] px-2.5 py-0.5 animate-pulse">
            {t("settings.unsaved")}
          </Badge>
        )}

        {canManage && onSave && (
          <Button
            type="button"
            onClick={onSave}
            disabled={isPending || !isDirty}
            size="sm"
            className="h-8 rounded-full px-4 text-xs font-semibold shadow-xs gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t("settings.saving")}
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                {t("common.save")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
