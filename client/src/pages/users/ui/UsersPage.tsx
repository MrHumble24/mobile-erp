import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { PageHeader } from "@/shared/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { UsersTab } from "./UsersTab"
import { RolesTab } from "./RolesTab"
import { PermissionMatrixTab } from "./PermissionMatrixTab"

export function UsersPage() {
  const { t } = useI18n()
  const [tab, setTab] = React.useState("users")

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description="Do'kon xodimlari hisoblari, lavozim rollari va ruxsatnomalar matritsasini sozlash"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-auto inline-flex">
            <TabsTrigger value="users">{t("users.tabUsers")}</TabsTrigger>
            <TabsTrigger value="roles">{t("users.tabRoles")}</TabsTrigger>
            <TabsTrigger value="matrix">{t("users.tabPermissions")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-5">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles" className="mt-5">
          <RolesTab />
        </TabsContent>

        <TabsContent value="matrix" className="mt-5">
          <PermissionMatrixTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
