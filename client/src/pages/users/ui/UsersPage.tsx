import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { UsersTab } from "./UsersTab"
import { RolesTab } from "./RolesTab"
import { PermissionMatrixTab } from "./PermissionMatrixTab"

export function UsersPage() {
  const { t } = useI18n()
  const [tab, setTab] = React.useState("users")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("users.title")}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">{t("users.tabUsers")}</TabsTrigger>
          <TabsTrigger value="roles">{t("users.tabRoles")}</TabsTrigger>
          <TabsTrigger value="matrix">{t("users.tabPermissions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="matrix">
          <PermissionMatrixTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
