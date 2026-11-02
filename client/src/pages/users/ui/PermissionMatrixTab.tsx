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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

function PermissionGroup({
  resource,
  permissions,
  selectedCodes,
  onToggle,
}: {
  resource: string
  permissions: Array<{ code: string; action: string; description: string | null }>
  selectedCodes: string[]
  onToggle: (code: string) => void
}) {
  return (
    <div className="p-4 border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)] space-y-3">
      <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
        {resource}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {permissions.map((p) => (
          <label key={p.code} className="flex items-start gap-2 text-xs cursor-pointer p-2 rounded-[8px] hover:bg-[#f8f9fa] transition-colors">
            <Checkbox
              checked={selectedCodes.includes(p.code)}
              onCheckedChange={() => onToggle(p.code)}
              className="mt-0.5"
            />
            <div>
              <div className="font-mono font-medium">{p.code}</div>
              {p.description && <div className="text-[10px] text-muted-foreground">{p.description}</div>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

function PermissionGroupList({
  groups,
  selectedCodes,
  onToggle,
}: {
  groups: Record<string, PermissionView[]>
  selectedCodes: string[]
  onToggle: (code: string) => void
}) {
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([resource, perms]) => (
        <PermissionGroup
          key={resource}
          resource={resource}
          permissions={perms}
          selectedCodes={selectedCodes}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

function RolePermissionsEditor({
  role,
  permissions,
}: {
  role: RoleView
  permissions: PermissionView[]
}) {
  const { t } = useI18n()
  const setPermissionsMutation = useSetRolePermissions()
  const [selectedCodes, setSelectedCodes] = React.useState<string[]>(role.permissionCodes || [])

  const handleToggle = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSave = () => {
    setPermissionsMutation.mutate(
      { code: role.code, permissionCodes: selectedCodes },
      {
        onSuccess: () => toast.success(t("users.matrixSaved")),
        onError: (err: any) => toast.error(err?.message || t("common.error")),
      }
    )
  }

  const groups = React.useMemo(() => {
    const map: Record<string, PermissionView[]> = {}
    for (const p of permissions) {
      if (!map[p.resource]) map[p.resource] = []
      map[p.resource].push(p)
    }
    return map
  }, [permissions])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={setPermissionsMutation.isPending || role.isSystem}>
          {setPermissionsMutation.isPending ? t("common.loading") : t("users.saveMatrix")}
        </Button>
      </div>

      <PermissionGroupList groups={groups} selectedCodes={selectedCodes} onToggle={handleToggle} />
    </div>
  )
}

export function PermissionMatrixTab() {
  const { data: roles } = useRoles()
  const { data: permissions } = usePermissions()
  const [selectedRoleCode, setSelectedRoleCode] = React.useState<string>("")

  const activeRoleCode = selectedRoleCode || roles?.[0]?.code || ""
  const activeRole = roles?.find((r) => r.code === activeRoleCode)

  return (
    <div className="space-y-6">
      <div className="w-64">
        <Select value={activeRoleCode} onValueChange={(val) => setSelectedRoleCode(val || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Rolni tanlang" /></SelectTrigger>
          <SelectContent>
            {roles?.map((r) => (
              <SelectItem key={r.code} value={r.code}>{r.name} ({r.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeRole && permissions && (
        <RolePermissionsEditor key={activeRole.code} role={activeRole} permissions={permissions} />
      )}
    </div>
  )
}

