export interface StockTransferLineView {
  id: string;
  lineType: string;
  deviceId: string | null;
  device?: {
    id: string;
    imei: string | null;
    imei2: string | null;
    serialNumber: string | null;
    model: { id: string; brand: string; name: string };
    specs: unknown;
  } | null;
  previousStatusCode: string | null;
  modelId: string | null;
  model?: { id: string; brand: string; name: string } | null;
  quantity: number | null;
  unitCostSnapshot: string | null;
  note: string | null;
}

export interface StockTransferView {
  id: string;
  sourceStoreId: string;
  sourceStore: { id: string; name: string };
  targetStoreId: string;
  targetStore: { id: string; name: string };
  status: string;
  sentAt: Date;
  sentBy: { id: string; name: string };
  receivedAt: Date | null;
  receivedBy: { id: string; name: string } | null;
  cancelledAt: Date | null;
  cancelledBy: { id: string; name: string } | null;
  note: string | null;
  lines: StockTransferLineView[];
  createdAt: Date;
  updatedAt: Date;
}
