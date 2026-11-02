import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useUsersPage, type UserView } from "@/entities/user"
import { Button } from "@/shared/ui/button"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { useUsersFilters } from "../model/use-users-filters"
import { UserFilters } from "./UserFilters"
import { UsersSummary } from "./UsersSummary"
import { UsersTableRow } from "./UsersTableRow"
import { UserDetailSheet } from "./UserDetailSheet"
import { CreateUserDialog } from "./CreateUserDialog"

function UsersTableBody({
  users,
  currentUserId,
  onOpenDetail,
}: {
  users: UserView[]
  currentUserId?: string
  onOpenDetail: (user: UserView) => void
}) {
  const { t } = useI18n()
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-white shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users.fullName")}</TableHead>
            <TableHead>{t("users.email")}</TableHead>
            <TableHead>{t("users.roles")}</TableHead>
            <TableHead>{t("users.filterStatus")}</TableHead>
            <TableHead>{t("users.lastLogin")}</TableHead>
            <TableHead>{t("users.createdAt")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UsersTableRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function UsersTab() {
  const { t } = useI18n()
  const filters = useUsersFilters()
  const { data, isLoading } = useUsersPage(filters.queryFilters)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailId, setDetailId] = React.useState<string | null>(null)

  return (
    <div className="space-y-4">
      <UsersSummary />
      <div className="flex items-start justify-between gap-4">
        <UserFilters filters={filters} />
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="size-4" />
          {t("users.newUser")}
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64 rounded-[16px]" />}

      {data && (
        <>
          <UsersTableBody
            users={data.items}
            currentUserId={currentUserId}
            onOpenDetail={(u) => setDetailId(u.id)}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            rangeLabel={(from, to, total) => t("users.rangeLabel", { from, to, total })}
            onPageChange={filters.setPage}
            onPageSizeChange={filters.setPageSize}
          />
        </>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UserDetailSheet
        userId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
