import { http, uploadFile } from "@/shared/api/http"
import type {
  BrandingView,
  CompanyProfileView,
  UpdateCompanyProfileDto,
  ThemeView,
  SetupDto,
} from "../types/company.types"
import type { AuthUser } from "@/features/auth"

export const companyRepository = {
  getBranding(): Promise<BrandingView> {
    return http<BrandingView>("/branding")
  },

  getProfile(): Promise<CompanyProfileView> {
    return http<CompanyProfileView>("/company")
  },

  updateProfile(dto: UpdateCompanyProfileDto): Promise<CompanyProfileView> {
    return http<CompanyProfileView>("/company", {
      method: "PATCH",
      body: dto,
    })
  },

  uploadLogo(file: File): Promise<{ logoUrl: string }> {
    return uploadFile<{ logoUrl: string }>("/company/logo", file, "file")
  },

  getSetupStatus(): Promise<{ needsSetup: boolean }> {
    return http<{ needsSetup: boolean }>("/setup/status")
  },

  performSetup(dto: SetupDto): Promise<{ accessToken: string; user: AuthUser }> {
    return http<{ accessToken: string; user: AuthUser }>("/setup", {
      method: "POST",
      body: dto,
    })
  },

  getTelegramStatus(): Promise<{ isTokenSet: boolean; telegramChatId: string | null }> {
    return http<{ isTokenSet: boolean; telegramChatId: string | null }>("/settings/telegram")
  },

  updateTelegramToken(token: string): Promise<{ isTokenSet: boolean }> {
    return http<{ isTokenSet: boolean }>("/settings/telegram-token", {
      method: "PUT",
      body: { token },
    })
  },

  testTelegram(): Promise<{ success: boolean }> {
    return http<{ success: boolean }>("/settings/telegram/test", {
      method: "POST",
    })
  },

  listThemes(): Promise<ThemeView[]> {
    return http<ThemeView[]>("/themes")
  },
}
