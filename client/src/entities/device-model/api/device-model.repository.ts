import { http } from "@/shared/api/http"
import type {
  CreateDeviceModelDto,
  DeviceModelView,
  UpdateDeviceModelDto,
} from "../model/device-model.types"

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
}
