/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import type { DeviceView } from "../../../entities/device/model/device.types.ts"
import { devicesToPriceTags } from "./device-price-tags.ts"

function device(over: Partial<DeviceView>): DeviceView {
  return {
    id: "d1",
    imei: null,
    imei2: null,
    serialNumber: null,
    shipmentId: null,
    modelId: "m1",
    specs: {},
    targetPrice: null,
    statusCode: "IN_STOCK",
    intakeDate: "2026-01-01T00:00:00.000Z",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  }
}

test("a phone with an IMEI, storage and color becomes a full tag", () => {
  const tags = devicesToPriceTags(
    [device({ imei: "123456789012345", specs: { storage: "256 GB", color: "Black" }, targetPrice: "1200" })],
    { m1: "Apple iPhone 15" }
  )

  assert.deepEqual(tags, [
    {
      id: "d1",
      title: "Apple iPhone 15",
      subtitle: "256 GB · Black",
      price: "1200",
      code: "123456789012345",
    },
  ])
})

test("a unit with only a serial number uses the serial as its code and has no subtitle", () => {
  const tags = devicesToPriceTags([device({ serialNumber: "SER-001" })], { m1: "Apple iPhone 15" })

  assert.equal(tags[0].code, "SER-001")
  assert.equal(tags[0].subtitle, null)
})

test("a row without a price keeps the price null", () => {
  const tags = devicesToPriceTags([device({ imei: "123456789012345", targetPrice: null })], {})

  assert.equal(tags[0].price, null)
})
