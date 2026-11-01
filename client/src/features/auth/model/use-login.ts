import { useMutation } from "@tanstack/react-query"
import { authRepository, type LoginDto } from "../api/auth.repository"
import { useAuthStore } from "./auth.store"

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (dto: LoginDto) => authRepository.login(dto),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user)
    },
  })
}
