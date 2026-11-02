import * as React from "react"
import { Shield, Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useUsers, type UserView } from "@/entities/user"
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
import { CreateUserDialog } from "./CreateUserDialog"
import { EditUserRolesDialog } from "./EditUserRolesDialog"

function UserTableRow({
  user,
  onEditRoles,
}: {
  user: UserView
  onEditRoles: (u: UserView) => void
}) {
  const { t } = useI18n()

  return (
    <TableRow>
      <TableCell className="font-semibold text-sm">
        {user.profile?.firstName} {user.profile?.lastName || ""}
      </TableCell>
      <TableCell className="text-sm font-mono">{user.email}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <Badge key={r} variant="default" className="text-xs">{r}</Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "mint" : "outline"}>
          {user.isActive ? t("common.yes") : t("common.no")}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          onClick={() => onEditRoles(user)}
        >
          <Shield className="size-3.5" />
          {t("users.roles")}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function UsersTab() {
  const { t } = useI18n()
  const { data: users, isLoading } = useUsers()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserView | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("users.newUser")}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

      {users && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.fullName")}</TableHead>
              <TableHead>{t("users.email")}</TableHead>
              <TableHead>{t("users.roles")}</TableHead>
              <TableHead>{t("users.isActive")}</TableHead>
              <TableHead>So'nggi kirish</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserTableRow key={user.id} user={user} onEditRoles={setEditingUser} />
            ))}
          </TableBody>
        </Table>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserRolesDialog
        user={editingUser}
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />
    </div>
  )
}

