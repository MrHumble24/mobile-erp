import { http, isNetworkError } from "@/shared/api/http"
import { getCachedDeviceByCode } from "../lib/cached-device"
import type {
  ChangeStatusDto,
  DeviceDetailView,
  DeviceFilters,
  DeviceStatusHistoryView,
  DeviceView,
  EditCustomsFeeDto,
  EditExpenseDto,
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
    try {
      return await http<DeviceDetailView>(`/devices/by-imei/${imei}`)
    } catch (err) {
      // Offline/transport failure: fall back to the synced device cache.
      if (isNetworkError(err)) {
        const cached = await getCachedDeviceByCode(imei)
        if (cached) return cached
      }
      throw err
    }
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

  editExpense: async (id: string, dto: EditExpenseDto): Promise<DeviceView> => {
    return http<DeviceView>(`/devices/${id}/expense`, {
      method: "PATCH",
      body: dto,
    })
  },

  editCustomsFee: async (id: string, dto: EditCustomsFeeDto): Promise<DeviceView> => {
    return http<DeviceView>(`/devices/${id}/customs-fee`, {
      method: "PATCH",
      body: dto,
    })
  },
}
