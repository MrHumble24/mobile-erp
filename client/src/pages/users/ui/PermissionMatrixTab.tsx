import * as React from "react"
import { useI18n } from "@/shared/i18n"
import {
  usePermissions,
  useRoles,
  useSetRolePermissions,
  type PermissionView,
  type RoleView,
} from "@/entities/user"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

function groupByResource(perms: PermissionView[]): Record<string, PermissionView[]> {
  const map: Record<string, PermissionView[]> = {}
  for (const p of perms) (map[p.resource] ??= []).push(p)
  return map
}

function ResourceGroup({
  resource,
  perms,
  selected,
  disabled,
  onToggle,
  onToggleAll,
}: {
  resource: string
  perms: PermissionView[]
  selected: Set<string>
  disabled: boolean
  onToggle: (code: string) => void
  onToggleAll: (codes: string[], next: boolean) => void
}) {
  const codes = perms.map((p) => p.code)
  const allOn = codes.every((c) => selected.has(c))
  return (
    <div className="space-y-3 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={allOn}
          disabled={disabled}
          onCheckedChange={() => onToggleAll(codes, !allOn)}
        />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {resource}
        </h4>
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {perms.map((p) => (
          <label key={p.code} className="flex cursor-pointer items-start gap-2 rounded-[8px] p-2 text-xs hover:bg-muted">
            <Checkbox
              checked={selected.has(p.code)}
              disabled={disabled}
              onCheckedChange={() => onToggle(p.code)}
              className="mt-0.5"
            />
            <div>
              <div className="font-mono font-medium">{p.code}</div>
              {p.description && (
                <div className="text-[10px] text-muted-foreground">{p.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

function RoleEditor({ role, permissions }: { role: RoleView; permissions: PermissionView[] }) {
  const { t } = useI18n()
  const save = useSetRolePermissions()
  const initial = React.useMemo(() => new Set(role.permissionCodes), [role])
  const [selected, setSelected] = React.useState<Set<string>>(initial)
  React.useEffect(() => setSelected(initial), [initial])

  const dirty =
    selected.size !== initial.size || [...selected].some((c) => !initial.has(c))

  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })

  const toggleAll = (codes: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const c of codes) {
        if (on) next.add(c)
        else next.delete(c)
      }
      return next
    })

  const persist = () =>
    save.mutate(
      { code: role.code, permissionCodes: [...selected] },
      {
        onSuccess: () => toast.success(t("users.matrixSaved")),
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )

  const groups = groupByResource(permissions)

  return (
    <div className="space-y-4">
      {role.isSystem && (
        <p className="text-xs text-muted-foreground">{t("users.systemRoleMatrixLocked")}</p>
      )}
      {dirty && !role.isSystem && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-[12px] border border-border bg-card p-3 shadow-[var(--shadow-xs)]">
          <span className="text-xs text-muted-foreground">{t("users.unsavedChanges")}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(initial)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={persist} disabled={save.isPending}>
              {save.isPending ? t("common.loading") : t("users.saveMatrix")}
            </Button>
          </div>
        </div>
      )}
      {Object.entries(groups).map(([resource, perms]) => (
        <ResourceGroup
          key={resource}
          resource={resource}
          perms={perms}
          selected={selected}
          disabled={role.isSystem}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />
      ))}
    </div>
  )
}

export function PermissionMatrixTab() {
  const { t } = useI18n()
  const { data: roles } = useRoles()
  const { data: permissions } = usePermissions()
  const [selectedRoleCode, setSelectedRoleCode] = React.useState("")

  const activeRoleCode = selectedRoleCode || roles?.[0]?.code || ""
  const activeRole = roles?.find((r) => r.code === activeRoleCode)

  return (
    <div className="space-y-6">
      <div className="w-64">
        <Select value={activeRoleCode} onValueChange={(v) => setSelectedRoleCode(v || "")}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("users.selectRole")} />
          </SelectTrigger>
          <SelectContent>
            {roles?.map((r) => (
              <SelectItem key={r.code} value={r.code}>
                {r.name} ({r.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {activeRole && permissions && (
        <RoleEditor key={activeRole.code} role={activeRole} permissions={permissions} />
      )}
    </div>
  )
}
