import { Eye, Power, PowerOff } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { useUpdateUser, type UserView } from "@/entities/user"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { TableCell, TableRow } from "@/shared/ui/table"
import { toast } from "@/shared/ui/sonner"

export function UsersTableRow({
  user,
  isSelf,
  onOpenDetail,
}: {
  user: UserView
  isSelf: boolean
  onOpenDetail: (user: UserView) => void
}) {
  const { t } = useI18n()
  const update = useUpdateUser()

  const toggleActive = () =>
    update.mutate(
      { id: user.id, dto: { isActive: !user.isActive } },
      {
        onSuccess: () =>
          toast.success(user.isActive ? t("users.deactivated") : t("users.reactivated")),
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )

  return (
    <TableRow>
      <TableCell className="text-sm font-semibold">
        {user.profile?.firstName} {user.profile?.lastName || ""}
      </TableCell>
      <TableCell className="font-mono text-sm">{user.email}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <Badge key={r} variant="default" className="text-xs">
              {r}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "mint" : "outline"}>
          {user.isActive ? t("users.statusActive") : t("users.statusInactive")}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            title={t("users.viewDetail")}
            onClick={() => onOpenDetail(user)}
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            title={user.isActive ? t("users.deactivate") : t("users.reactivate")}
            onClick={toggleActive}
            disabled={update.isPending || (isSelf && user.isActive)}
          >
            {user.isActive ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
