import { create } from "zustand"
import { persist } from "zustand/middleware"
import { configureHttp } from "@/shared/api/http"

export interface AuthUserProfile {
  fullName: string
  phone?: string | null
}

export interface AuthUser {
  id: string
  email: string
  profile: AuthUserProfile
  roles: string[]
  permissions: string[]
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
  hasPermission: (code: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      hasPermission: (code) => {
        const perms = get().user?.permissions
        return Array.isArray(perms) && perms.includes(code)
      },
    }),
    {
      name: "mobile-erp-auth-session",
    }
  )
)

// Configure shared HTTP transport with auth store
configureHttp({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().clearSession()
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
  },
})
