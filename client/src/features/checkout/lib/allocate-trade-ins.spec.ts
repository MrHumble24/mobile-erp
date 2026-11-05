/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { allocateTradeIns, tradeInsTotal } from "./allocate-trade-ins.ts"

test("puts the largest trade-in on the line with the largest remaining price", () => {
  const r = allocateTradeIns(
    [
      { lineId: "a", price: 5_000_000 },
      { lineId: "b", price: 2_000_000 },
    ],
    [
      { id: "t1", value: 1_500_000 },
      { id: "t2", value: 1_000_000 },
    ]
  )
  assert.equal(r.ok, true)
  // t1 (bigger) takes line a (5m); t2 then sees a has 3.5m left vs b 2m → a.
  assert.deepEqual(r.itemsByLine.a, ["t1", "t2"])
  assert.deepEqual(r.itemsByLine.b, [])
  assert.equal(r.valueByLine.a, 2_500_000)
})

test("allows a trade-in equal to the line price (due becomes zero)", () => {
  const r = allocateTradeIns([{ lineId: "a", price: 3_000_000 }], [{ id: "t1", value: 3_000_000 }])
  assert.equal(r.ok, true)
  assert.equal(r.valueByLine.a, 3_000_000)
})

test("refuses a trade-in that no single line can carry", () => {
  const r = allocateTradeIns(
    [
      { lineId: "a", price: 1_000_000 },
      { lineId: "b", price: 900_000 },
    ],
    [{ id: "big", value: 1_200_000 }]
  )
  assert.equal(r.ok, false)
  assert.equal(r.unplaceableId, "big")
})

test("spreads trade-ins across lines when one line cannot hold them all", () => {
  const r = allocateTradeIns(
    [
      { lineId: "a", price: 2_000_000 },
      { lineId: "b", price: 2_000_000 },
    ],
    [
      { id: "t1", value: 1_800_000 },
      { id: "t2", value: 1_800_000 },
    ]
  )
  assert.equal(r.ok, true)
  assert.deepEqual(r.itemsByLine.a, ["t1"])
  assert.deepEqual(r.itemsByLine.b, ["t2"])
})

test("tradeInsTotal sums values cent-exact", () => {
  assert.equal(tradeInsTotal([{ value: 1_500_000 }, { value: 1_000_000 }]), 2_500_000)
  assert.equal(tradeInsTotal([]), 0)
})
