import { Navigate, Outlet, useLocation } from "react-router"
import { useAuthStore, useSessionRefresh } from "@/features/auth"
import { useI18n } from "@/shared/i18n"

interface RequirePermissionProps {
  permission?: string
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { t } = useI18n()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const allowed = useAuthStore((s) => !permission || s.hasPermission(permission))
  useSessionRefresh()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold tracking-tight text-destructive">{t("common.forbiddenTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{t("common.forbiddenBody")}</p>
      </div>
    )
  }

  return <Outlet />
}
