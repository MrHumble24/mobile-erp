import { Navigate, Outlet, useLocation } from "react-router"
import { useAuthStore } from "@/features/auth"
import { useI18n } from "@/shared/i18n"

interface RequirePermissionProps {
  permission?: string
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { t } = useI18n()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const hasPermission = useAuthStore((s) => s.hasPermission)

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold tracking-tight text-destructive">403 — Ruxsat etilmagan</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {t("common.error")}: Ushbu sahifani ko'rish uchun ruxsat berilmagan.
        </p>
      </div>
    )
  }

  return <Outlet />
}
