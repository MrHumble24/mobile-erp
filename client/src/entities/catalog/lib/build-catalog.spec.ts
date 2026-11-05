/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { buildCatalogEntries, buildCatalogUnits, type CachedDeviceRow, type CachedProductRow } from "./build-catalog.ts"

interface DeviceOverride {
  id: string
  modelId: string
  imei?: string | null
  serialNumber?: string | null
  statusCode?: string
  specs?: Record<string, unknown> | null
  targetPrice?: string | null
  model?: { brand?: string; name?: string; kindCode?: CachedDeviceRow["model"]["kindCode"] }
  latestInspection?: { gradeCode: string | null } | null
}

function device(over: DeviceOverride): CachedDeviceRow {
  return {
    id: over.id,
    imei: over.imei ?? null,
    serialNumber: over.serialNumber ?? null,
    statusCode: over.statusCode ?? "IN_STOCK",
    specs: over.specs ?? {},
    targetPrice: over.targetPrice ?? null,
    model: {
      id: over.modelId,
      brand: over.model?.brand ?? "Apple",
      name: over.model?.name ?? "iPhone",
      kindCode: over.model?.kindCode ?? "IMEI",
      categoryId: null,
      imageUrl: null,
    },
    latestInspection: over.latestInspection ?? null,
  }
}

const product: CachedProductRow = {
  modelId: "p1",
  brand: "Anker",
  name: "Cable",
  salePrice: "30000.00",
  quantity: 5,
  categoryId: "acc",
  imageUrl: null,
}

test("groups in-stock units per model with count and price range; drops non-stock", () => {
  const devices = [
    device({ id: "a", modelId: "m1", targetPrice: "700", specs: { storage: "256gb" } }),
    device({ id: "b", modelId: "m1", targetPrice: "900", specs: { storage: "512gb" } }),
    device({ id: "c", modelId: "m1", targetPrice: "800", statusCode: "SOLD" }),
  ]
  const [entry] = buildCatalogEntries(devices, [])
  assert.equal(entry.inStock, 2)
  assert.equal(entry.minTargetPrice, "700")
  assert.equal(entry.maxTargetPrice, "900")
  assert.equal(entry.salePrice, null)
})

test("quantity products become their own card; category filter drops the rest", () => {
  const devices = [device({ id: "a", modelId: "m1", targetPrice: "700" })]
  const filtered = buildCatalogEntries(devices, [product], { categoryId: "acc" })
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].kindCode, "QUANTITY")
  assert.equal(filtered[0].inStock, 5)
})

test("search matches name and the storage spec", () => {
  const devices = [
    device({ id: "a", modelId: "m1", model: { brand: "Apple", name: "iPhone 15" }, specs: { storage: "256gb" } }),
  ]
  assert.equal(buildCatalogEntries(devices, [], { search: "256" }).length, 1)
  assert.equal(buildCatalogEntries(devices, [], { search: "galaxy" }).length, 0)
})

test("units reads imei or serial as the code and only in-stock rows", () => {
  const devices = [
    device({ id: "a", modelId: "m1", imei: "111" }),
    device({ id: "b", modelId: "m1", serialNumber: "SN2", imei: null }),
    device({ id: "c", modelId: "m1", statusCode: "SOLD" }),
  ]
  const units = buildCatalogUnits(devices, "m1")
  assert.deepEqual(units.map((u) => u.code).sort(), ["111", "SN2"])
})
