import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateDeliveryFee } from "./delivery-fee.ts"

describe("calculateDeliveryFee", () => {
  it("pickup is always 0 fee", () => {
    const fee = calculateDeliveryFee({
      fulfillmentMethod: "PICKUP",
      pickupEnabled: true,
      deliveryEnabled: true,
      pricingMode: "FLAT",
      flatFee: 30000,
      orderPrice: 100000,
    })
    assert.equal(fee, 0)
  })

  it("free delivery mode is 0 fee", () => {
    const fee = calculateDeliveryFee({
      fulfillmentMethod: "DELIVERY",
      pickupEnabled: true,
      deliveryEnabled: true,
      pricingMode: "FREE",
      orderPrice: 50000,
    })
    assert.equal(fee, 0)
  })

  it("flat fee mode applies flat fee below freeFrom threshold", () => {
    const fee = calculateDeliveryFee({
      fulfillmentMethod: "DELIVERY",
      pickupEnabled: true,
      deliveryEnabled: true,
      pricingMode: "FLAT",
      flatFee: 30000,
      freeFrom: 5000000,
      orderPrice: 4999999,
    })
    assert.equal(fee, 30000)
  })

  it("flat fee mode is 0 when orderPrice reaches or exceeds freeFrom threshold", () => {
    const fee = calculateDeliveryFee({
      fulfillmentMethod: "DELIVERY",
      pickupEnabled: true,
      deliveryEnabled: true,
      pricingMode: "FLAT",
      flatFee: 30000,
      freeFrom: 5000000,
      orderPrice: 5000000,
    })
    assert.equal(fee, 0)
  })

  it("by-zone pricing uses the selected zone fee below threshold", () => {
    const fee = calculateDeliveryFee({
      fulfillmentMethod: "DELIVERY",
      pickupEnabled: true,
      deliveryEnabled: true,
      pricingMode: "BY_ZONE",
      freeFrom: 5000000,
      orderPrice: 1000000,
      zone: { id: "z1", name: "Center", fee: 25000 },
    })
    assert.equal(fee, 25000)
  })

  it("by-zone pricing is 0 when orderPrice exceeds freeFrom threshold", () => {
    const fee = calculateDeliveryFee({
      fulfillmentMethod: "DELIVERY",
      pickupEnabled: true,
      deliveryEnabled: true,
      pricingMode: "BY_ZONE",
      freeFrom: 5000000,
      orderPrice: 6000000,
      zone: { id: "z1", name: "Center", fee: 25000 },
    })
    assert.equal(fee, 0)
  })
})
