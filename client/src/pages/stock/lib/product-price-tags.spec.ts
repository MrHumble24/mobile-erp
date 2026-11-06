/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import type { StockLevelView } from "../../../entities/stock/model/stock.types.ts"
import { productsToPriceTags } from "./product-price-tags.ts"

function product(over: Partial<StockLevelView>): StockLevelView {
  return {
    modelId: "p1",
    brand: "Apple",
    name: "iPhone 15",
    barcode: null,
    modelCode: null,
    categoryId: null,
    salePrice: null,
    quantity: 1,
    averageCost: null,
    value: null,
    ...over,
  }
}

test("a product with a barcode and a sale price becomes a tag with no subtitle", () => {
  const tags = productsToPriceTags([product({ barcode: "4780000000001", salePrice: "999" })])

  assert.deepEqual(tags, [
    {
      id: "p1",
      title: "iPhone 15",
      subtitle: null,
      price: "999",
      code: "4780000000001",
    },
  ])
})

test("a product without a barcode gets no code", () => {
  const tags = productsToPriceTags([product({ barcode: null, salePrice: "999" })])

  assert.equal(tags[0].code, null)
})

test("a product row without a price keeps the price null", () => {
  const tags = productsToPriceTags([product({ barcode: "4780000000001", salePrice: null })])

  assert.equal(tags[0].price, null)
})
