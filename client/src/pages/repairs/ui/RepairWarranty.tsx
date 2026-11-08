import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import type { RepairView } from "@/entities/repair"

/** Warranty window, shown once the phone is given back. */
export function RepairWarranty({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  if (!repair.givenBackAt) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight">{t("repairs.warrantyTitle")}</h3>
      <div className="flex items-center gap-2 text-sm">
        {repair.underWarranty ? (
          <Badge variant="emerald">{t("repairs.underWarranty")}</Badge>
        ) : (
          <Badge variant="outline">{t("repairs.noWarranty")}</Badge>
        )}
        {repair.warrantyUntil && (
          <span className="text-muted-foreground">
            {t("repairs.warrantyUntil")}: {formatDate(repair.warrantyUntil)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("repairs.givenBackAt")}: {formatDate(repair.givenBackAt)}
      </p>
    </div>
  )
}
