import { http } from "@/shared/api/http"
import type { StoreSettings, UpdateSettingsDto } from "../model/settings.types"

export const settingsRepository = {
  get: async (): Promise<StoreSettings> => {
    return http<StoreSettings>("/settings")
  },

  update: async (dto: UpdateSettingsDto): Promise<StoreSettings> => {
    return http<StoreSettings>("/settings", {
      method: "PUT",
      body: dto,
    })
  },
}
