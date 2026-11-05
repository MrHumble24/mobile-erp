import type { DeviceDetailView } from "@/entities/device"
import type { StockScanProduct } from "@/entities/stock"

/**
 * The result of one till scan (ADR 0030): the code matched a unit, a quantity
 * product's barcode, or nothing. Units win over barcodes (resolved server-side).
 */
export type ScanLookup =
  | { kind: "unit"; unit: DeviceDetailView }
  | { kind: "product"; product: StockScanProduct }
  | { kind: "notFound" }
