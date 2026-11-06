import * as React from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useRoles, useDeleteRole, type RoleView } from "@/entities/user"
import { HttpError } from "@/shared/api/http"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { toast } from "@/shared/ui/sonner"
import { CreateRoleDialog } from "./CreateRoleDialog"
import { EditRoleDialog } from "./EditRoleDialog"

function RoleTableRow({
  role,
  onEdit,
}: {
  role: RoleView
  onEdit: (role: RoleView) => void
}) {
  const { t } = useI18n()
  const del = useDeleteRole()

  const remove = () => {
    if (!window.confirm(t("users.confirmDeleteRole", { role: role.name }))) return
    del.mutate(role.code, {
      onSuccess: () => toast.success(t("users.roleDeleted")),
      onError: (err) => {
        if (err instanceof HttpError && err.statusCode === 409) {
          const count = (err.data as { assignedUsers?: number })?.assignedUsers ?? 0
          toast.error(t("users.roleInUse", { count }))
        } else {
          toast.error((err as Error).message || t("common.error"))
        }
      },
    })
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm font-bold">{role.code}</TableCell>
      <TableCell className="text-sm font-semibold">{role.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{role.description || "—"}</TableCell>
      <TableCell>
        <Badge variant={role.isSystem ? "violet" : "default"}>
          {role.isSystem ? t("users.systemRole") : t("users.customRole")}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">{role.permissionCodes.length}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button size="icon" variant="outline" className="size-8" onClick={() => onEdit(role)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            onClick={remove}
            disabled={role.isSystem || del.isPending}
            title={role.isSystem ? t("users.systemRoleLocked") : t("common.delete")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function RolesTab() {
  const { t } = useI18n()
  const { data: roles, isLoading } = useRoles()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<RoleView | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("users.newRole")}
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64 rounded-[16px]" />}

      {roles && (
        <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.roleCode")}</TableHead>
                <TableHead>{t("users.roleName")}</TableHead>
                <TableHead>{t("users.description")}</TableHead>
                <TableHead>{t("users.roleType")}</TableHead>
                <TableHead>{t("users.permissionsCount")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <RoleTableRow key={role.code} role={role} onEdit={setEditing} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRoleDialog
        role={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  )
}
