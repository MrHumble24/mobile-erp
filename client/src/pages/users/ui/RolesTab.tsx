import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useRoles, type RoleView } from "@/entities/user"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { CreateRoleDialog } from "./CreateRoleDialog"

function RoleTableRow({ role }: { role: RoleView }) {
  return (
    <TableRow>
      <TableCell className="font-mono font-bold text-sm">{role.code}</TableCell>
      <TableCell className="font-semibold text-sm">{role.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{role.description || "—"}</TableCell>
      <TableCell>
        <Badge variant={role.isSystem ? "plasma" : "limestone"}>
          {role.isSystem ? "Tizim roli" : "Maxsus rol"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm font-mono">{role.permissionCodes.length} ta</TableCell>
    </TableRow>
  )
}

export function RolesTab() {
  const { t } = useI18n()
  const { data: roles, isLoading } = useRoles()
  const [createOpen, setCreateOpen] = React.useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("users.newRole")}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

      {roles && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.roleCode")}</TableHead>
              <TableHead>{t("users.roleName")}</TableHead>
              <TableHead>{t("users.description")}</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>{t("users.permissionsCount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <RoleTableRow key={role.code} role={role} />
            ))}
          </TableBody>
        </Table>
      )}

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
