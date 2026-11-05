import { useI18n } from "@/shared/i18n"
import { Badge } from "@/shared/ui/badge"
import { statusVariant, statusI18nKey } from "../lib/status-visual"

/** The ticket status as a coloured badge. Falls back to the server label for an
 *  unknown code so a future status still renders. */
export function RepairStatusBadge({
  statusCode,
  statusLabel,
}: {
  statusCode: string
  statusLabel?: string
}) {
  const { t } = useI18n()
  const key = statusI18nKey(statusCode)
  const label = key ? t(key) : (statusLabel ?? statusCode)
  // Badge's variant union is wide; the mapping only ever returns valid names.
  return <Badge variant={statusVariant(statusCode) as "default"}>{label}</Badge>
}
