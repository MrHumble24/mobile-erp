import { http, uploadFile } from "@/shared/api/http"
import type {
  CreateDeviceModelDto,
  DeviceModelView,
  UpdateDeviceModelDto,
} from "../model/device-model.types"

/** Image types the server accepts (ADR 0031); mirrored client-side for an early check. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export const deviceModelRepository = {
  list: async (): Promise<DeviceModelView[]> => {
    return http<DeviceModelView[]>("/device-models")
  },

  create: async (dto: CreateDeviceModelDto): Promise<DeviceModelView> => {
    return http<DeviceModelView>("/device-models", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdateDeviceModelDto): Promise<DeviceModelView> => {
    return http<DeviceModelView>(`/device-models/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  uploadImage: async (id: string, file: File): Promise<DeviceModelView> => {
    return uploadFile<DeviceModelView>(`/device-models/${id}/image`, file)
  },

  removeImage: async (id: string): Promise<DeviceModelView> => {
    return http<DeviceModelView>(`/device-models/${id}/image`, { method: "DELETE" })
  },
}
