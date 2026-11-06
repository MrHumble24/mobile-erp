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
  stores?: { id: string; name: string }[]
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
    (set, get) => {
      // A new function per session change, so components that select
      // `s.hasPermission` itself re-render when the permissions change.
      const makeHasPermission = () => (code: string) => {
        const perms = get().user?.permissions
        return Array.isArray(perms) && perms.includes(code)
      }
      return {
        token: null,
        user: null,
        setSession: (token, user) => set({ token, user, hasPermission: makeHasPermission() }),
        clearSession: () => set({ token: null, user: null }),
        hasPermission: makeHasPermission(),
      }
    },
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
