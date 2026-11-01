import { http } from "@/shared/api/http"
import type {
  CreateShipmentDto,
  RegisterDevicesDto,
  RegisteredDeviceView,
  ShipmentView,
  UpdateShipmentDto,
} from "../model/shipment.types"

export const shipmentRepository = {
  list: async (): Promise<ShipmentView[]> => {
    return http<ShipmentView[]>("/shipments")
  },

  get: async (id: string): Promise<ShipmentView> => {
    return http<ShipmentView>(`/shipments/${id}`)
  },

  create: async (dto: CreateShipmentDto): Promise<ShipmentView> => {
    return http<ShipmentView>("/shipments", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdateShipmentDto): Promise<ShipmentView> => {
    return http<ShipmentView>(`/shipments/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  addDevices: async (id: string, dto: RegisterDevicesDto): Promise<RegisteredDeviceView[]> => {
    return http<RegisteredDeviceView[]>(`/shipments/${id}/devices`, {
      method: "POST",
      body: dto,
    })
  },
}
