import { http } from "@/shared/api/http"
import type { AuthUser } from "../model/auth.store"

export interface LoginDto {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export const authRepository = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    return http<LoginResponse>("/auth/login", {
      method: "POST",
      body: dto,
    })
  },

  me: async (): Promise<AuthUser> => {
    return http<AuthUser>("/auth/me")
  },
}
