export interface StockTransferLineView {
  id: string
  transferId: string
  lineType: "UNIT" | "QUANTITY"
  deviceId: string | null
  device?: {
    id: string
    imei: string | null
    serialNumber: string | null
    model?: { id: string; brand: string; name: string }
  } | null
  modelId: string | null
  model?: { id: string; brand: string; name: string } | null
  quantity: number | null
  unitCostSnapshot: string | null
  previousStatusCode: string | null
  note: string | null
  createdAt: string
}

export interface StockTransferView {
  id: string
  transferNumber: string
  sourceStoreId: string
  sourceStore: { id: string; name: string }
  targetStoreId: string
  targetStore: { id: string; name: string }
  status: "SENT" | "RECEIVED" | "CANCELLED"
  note: string | null
  sentAt: string
  sentById: string
  receivedAt: string | null
  receivedById: string | null
  cancelledAt: string | null
  cancelledById: string | null
  lines: StockTransferLineView[]
  createdAt: string
}

export interface CreateTransferLineInput {
  lineType: "UNIT" | "QUANTITY"
  deviceId?: string
  modelId?: string
  quantity?: number
  note?: string
}

export interface CreateStockTransferDto {
  targetStoreId: string
  note?: string
  lines: CreateTransferLineInput[]
}

export interface ListStockTransfersQuery {
  status?: "SENT" | "RECEIVED" | "CANCELLED"
  page?: number
  pageSize?: number
}
