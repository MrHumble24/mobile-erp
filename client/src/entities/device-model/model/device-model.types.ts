export interface DeviceModelView {
  id: string
  brand: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDeviceModelDto {
  brand: string
  name: string
  isActive?: boolean
}

export interface UpdateDeviceModelDto {
  brand?: string
  name?: string
  isActive?: boolean
}
