import * as React from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/shared/ui/sonner"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "./auth.store"

export interface UseLogoutOptions {
  onLogout?: () => void
  showToast?: boolean
  redirectTo?: string
}

export function useLogout(options: UseLogoutOptions = {}) {
  const { onLogout, showToast = true, redirectTo = "/login" } = options
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const { t } = useI18n()

  const logout = React.useCallback(() => {
    try {
      onLogout?.()
    } catch {
      // ignore callback error during logout
    }

    clearSession()
    queryClient.clear()
    navigate(redirectTo, { replace: true })

    if (showToast) {
      toast.success(t("auth.logoutSuccess"))
    }
  }, [clearSession, navigate, onLogout, queryClient, redirectTo, showToast, t])

  return { logout }
}

