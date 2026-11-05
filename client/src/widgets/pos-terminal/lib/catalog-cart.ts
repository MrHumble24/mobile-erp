import type { CatalogEntry, CatalogUnit } from "@/entities/catalog"
import type { DeviceDetailView, DeviceSpecs } from "@/entities/device"
import type { StockScanProduct } from "@/entities/stock"

/**
 * Maps a catalog unit the seller tapped into the cart's device shape (ADR 0031).
 * A unit product's `kindCode` says which identifier the code is (IMEI vs
 * serial); only the fields a cart line and its checkout need are filled.
 */
export function catalogUnitToDevice(entry: CatalogEntry, unit: CatalogUnit): DeviceDetailView {
  const isImei = entry.kindCode === "IMEI"
  const now = new Date().toISOString()
  return {
    id: unit.id,
    imei: isImei ? unit.code : null,
    imei2: null,
    serialNumber: isImei ? null : unit.code,
    shipmentId: "",
    modelId: entry.modelId,
    specs: (unit.specs ?? {}) as DeviceSpecs,
    targetPrice: unit.targetPrice,
    prices: unit.prices,
    statusCode: "IN_STOCK",
    intakeDate: now,
    version: 0,
    createdAt: now,
    updatedAt: now,
    model: { id: entry.modelId, brand: entry.brand, name: entry.name },
    status: { code: "IN_STOCK", label: "IN_STOCK" },
    latestInspection: unit.gradeCode
      ? { id: "", passed: true, gradeCode: unit.gradeCode, batteryHealth: null, inspectedAt: now }
      : null,
  }
}

/** Maps a quantity catalog entry into the scan-product shape the cart adds. */
export function catalogEntryToProduct(entry: CatalogEntry): StockScanProduct {
  return {
    modelId: entry.modelId,
    brand: entry.brand,
    name: entry.name,
    barcode: null,
    salePrice: entry.salePrice,
    quantity: entry.inStock,
    prices: entry.prices,
  }
}
