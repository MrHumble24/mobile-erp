import * as React from "react"
import { KeyRound, Power, PowerOff } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useUser, useUpdateUser, type UserView } from "@/entities/user"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { toast } from "@/shared/ui/sonner"
import { UserProfileForm } from "./UserProfileForm"
import { UserRolesSection } from "./UserRolesSection"
import { UserPermissionMatrix } from "./UserPermissionMatrix"
import { UserStoresSection } from "./UserStoresSection"
import { ResetPasswordDialog } from "./ResetPasswordDialog"

function StatusActions({ user, isSelf }: { user: UserView; isSelf: boolean }) {
  const { t } = useI18n()
  const update = useUpdateUser()
  const [resetOpen, setResetOpen] = React.useState(false)

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
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={user.isActive ? "mint" : "outline"}>
        {user.isActive ? t("users.statusActive") : t("users.statusInactive")}
      </Badge>
      <Button
        size="sm"
        variant={user.isActive ? "destructive" : "outline"}
        className="gap-1.5"
        onClick={toggleActive}
        disabled={update.isPending || (isSelf && user.isActive)}
      >
        {user.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
        {user.isActive ? t("users.deactivate") : t("users.reactivate")}
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setResetOpen(true)}>
        <KeyRound className="size-4" />
        {t("users.resetPassword")}
      </Button>
      <ResetPasswordDialog
        userId={user.id}
        email={user.email}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </div>
  )
}

function DetailBody({ user, isSelf }: { user: UserView; isSelf: boolean }) {
  const { t } = useI18n()
  return (
    <div className="my-4 space-y-5">
      <StatusActions user={user} isSelf={isSelf} />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("users.tabProfile")}</TabsTrigger>
          <TabsTrigger value="roles">{t("users.roles")}</TabsTrigger>
          <TabsTrigger value="stores">{t("users.stores")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("users.tabOverrides")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <UserProfileForm user={user} />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <UserRolesSection user={user} isSelf={isSelf} />
        </TabsContent>
        <TabsContent value="stores" className="mt-4">
          <UserStoresSection user={user} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <UserPermissionMatrix user={user} isSelf={isSelf} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function UserDetailSheet({
  userId,
  open,
  onClose,
}: {
  userId: string | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useI18n()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data: user, isLoading } = useUser(open && userId ? userId : "")

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {user ? `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() : t("users.detailTitle")}
          </SheetTitle>
          <SheetDescription>{user?.email ?? ""}</SheetDescription>
        </SheetHeader>
        {isLoading && <Skeleton className="my-4 h-64 rounded-[16px]" />}
        {user && <DetailBody user={user} isSelf={user.id === currentUserId} />}
      </SheetPopup>
    </Sheet>
  )
}
