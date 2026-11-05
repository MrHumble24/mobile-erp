import { test } from "node:test"
import assert from "node:assert/strict"
import { validateRows, toCreateDto } from "./create-price-list.schema.ts"
import { feeChangeOf } from "../../../entities/customs/model/customs.types.ts"

test("validateRows rejects an empty list", () => {
  assert.equal(validateRows([]), "empty")
  assert.equal(validateRows([{ customsCode: "  ", description: "", fee: "1" }]), "empty")
})

test("validateRows rejects duplicate codes case-insensitively", () => {
  assert.equal(
    validateRows([
      { customsCode: "ip16", description: "", fee: "1" },
      { customsCode: "IP16", description: "", fee: "2" },
    ]),
    "duplicate"
  )
})

test("validateRows accepts a distinct, non-empty list", () => {
  assert.equal(
    validateRows([
      { customsCode: "IP16", description: "", fee: "1" },
      { customsCode: "SGS24", description: "", fee: "2" },
    ]),
    null
  )
})

test("toCreateDto trims, drops blank descriptions and numbers the fee", () => {
  const dto = toCreateDto({
    effectiveAt: "2026-10-15",
    note: "  ",
    items: [{ customsCode: " IP16 ", description: "  ", fee: "500000" }],
  })
  assert.equal(dto.note, undefined)
  assert.deepEqual(dto.items, [{ customsCode: "IP16", description: undefined, fee: 500000 }])
})

test("feeChangeOf marks new / up / down / same", () => {
  const base = { customsCode: "X", description: null, usedByModel: false }
  assert.equal(feeChangeOf({ ...base, fee: "100", previousFee: null }), "new")
  assert.equal(feeChangeOf({ ...base, fee: "150", previousFee: "100" }), "up")
  assert.equal(feeChangeOf({ ...base, fee: "80", previousFee: "100" }), "down")
  assert.equal(feeChangeOf({ ...base, fee: "100", previousFee: "100" }), "same")
})
