import { http } from "@/shared/api/http"
import type {
  ChangeStatusDto,
  DeviceDetailView,
  DeviceFilters,
  DeviceStatusHistoryView,
  DeviceView,
  PaginatedDevices,
  UpdateDeviceDto,
} from "../model/device.types"

export const deviceRepository = {
  list: async (filters?: DeviceFilters): Promise<PaginatedDevices> => {
    return http<PaginatedDevices>("/devices", {
      params: filters as Record<string, string | number | boolean | undefined | null>,
    })
  },

  getByImei: async (imei: string): Promise<DeviceDetailView> => {
    return http<DeviceDetailView>(`/devices/by-imei/${imei}`)
  },

  getById: async (id: string): Promise<DeviceView> => {
    return http<DeviceView>(`/devices/${id}`)
  },

  getHistory: async (id: string): Promise<DeviceStatusHistoryView[]> => {
    return http<DeviceStatusHistoryView[]>(`/devices/${id}/history`)
  },

  update: async (id: string, dto: UpdateDeviceDto): Promise<DeviceView> => {
    return http<DeviceView>(`/devices/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  changeStatus: async (id: string, dto: ChangeStatusDto): Promise<DeviceView> => {
    return http<DeviceView>(`/devices/${id}/status`, {
      method: "POST",
      body: dto,
    })
  },
}
