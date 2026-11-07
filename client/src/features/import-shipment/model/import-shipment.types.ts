import type { ShipmentView, RegisteredDeviceView } from "@/entities/shipment"

export interface ImportShipmentRow {
  row: number
  modelName: string
  imei: string
  imei2?: string
  price: number
  expense: number
  markup?: number
  batteryHealth?: number
  defects?: string
}

export interface ImportShipmentProblem {
  row: number
  code: string
  detail: string
}

export interface ImportShipmentWarning {
  row: number
  code: string
  detail: string
}

export interface ImportShipmentDto {
  storeId: string
  supplierId: string
  shipmentDate: string
  paymentAccountCode: string
  exchangeRate: number
  notes?: string
  rows: ImportShipmentRow[]
}

export interface ImportShipmentResultView extends ShipmentView {
  devices: RegisteredDeviceView[]
  warnings: ImportShipmentWarning[]
}
