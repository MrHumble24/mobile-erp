import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { authRepository } from "../api/auth.repository"
import { useAuthStore } from "./auth.store"

/**
 * Re-reads the signed-in user when the app loads, so roles and permissions
 * changed since sign-in apply without signing out and in again.
 */
export function useSessionRefresh() {
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
  const { data } = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: authRepository.me,
    enabled: Boolean(token),
  })

  useEffect(() => {
    if (token && data) setSession(token, data)
  }, [token, data, setSession])
}
