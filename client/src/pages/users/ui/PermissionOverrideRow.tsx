import { useI18n } from "@/shared/i18n"
import type { PermissionView } from "@/entities/user"
import { Badge } from "@/shared/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

export type OverrideState = "inherit" | "grant" | "revoke"

/** Human source for a permission given its current override and role grants. */
function sourceLabel(
  state: OverrideState,
  roleCodes: string[],
  t: (k: string, p?: Record<string, string | number>) => string
): { text: string; tone: "mint" | "violet" | "outline" } {
  if (state === "grant") return { text: t("users.sourceUserGrant"), tone: "mint" }
  if (state === "revoke") return { text: t("users.sourceUserRevoke"), tone: "outline" }
  if (roleCodes.length > 0)
    return { text: t("users.sourceRoles", { roles: roleCodes.join(", ") }), tone: "violet" }
  return { text: t("users.sourceNone"), tone: "outline" }
}

export function PermissionOverrideRow({
  permission,
  state,
  roleCodes,
  disabled,
  onChange,
}: {
  permission: PermissionView
  state: OverrideState
  roleCodes: string[]
  disabled: boolean
  onChange: (state: OverrideState) => void
}) {
  const { t } = useI18n()
  const source = sourceLabel(state, roleCodes, t)

  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] p-2 hover:bg-muted">
      <div className="min-w-0">
        <div className="font-mono text-xs font-medium">{permission.code}</div>
        <Badge variant={source.tone} className="mt-0.5 text-[10px]">
          {source.text}
        </Badge>
      </div>
      <Select
        value={state}
        onValueChange={(v) => onChange(v as OverrideState)}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 w-32 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inherit">{t("users.overrideInherit")}</SelectItem>
          <SelectItem value="grant">{t("users.overrideGrant")}</SelectItem>
          <SelectItem value="revoke">{t("users.overrideRevoke")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
