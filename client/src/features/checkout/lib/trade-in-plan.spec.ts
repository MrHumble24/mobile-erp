/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { planTradeIns } from "./trade-in-plan.ts"

test("no trade-ins: amount to pay is the cart total, lines unchanged", () => {
  const p = planTradeIns(
    [
      { lineId: "a", price: 5_000_000 },
      { lineId: "b", price: 2_000_000 },
    ],
    []
  )
  assert.equal(p.ok, true)
  assert.equal(p.tradeInTotal, 0)
  assert.equal(p.amountToPay, 7_000_000)
  assert.deepEqual(p.payableLines, [
    { lineId: "a", salePrice: 5_000_000 },
    { lineId: "b", salePrice: 2_000_000 },
  ])
})

test("amount to pay = total − trade-ins, payable per line nets its trade-in", () => {
  const p = planTradeIns([{ lineId: "a", price: 5_000_000 }], [{ id: "t1", value: 1_000_000 }])
  assert.equal(p.ok, true)
  assert.equal(p.tradeInTotal, 1_000_000)
  assert.equal(p.amountToPay, 4_000_000)
  assert.deepEqual(p.payableLines, [{ lineId: "a", salePrice: 4_000_000 }])
  assert.deepEqual(p.itemsByLine.a, ["t1"])
})

test("a trade-in equal to the line price leaves zero to pay on that line", () => {
  const p = planTradeIns(
    [
      { lineId: "a", price: 3_000_000 },
      { lineId: "b", price: 3_000_000 },
    ],
    [{ id: "t1", value: 3_000_000 }]
  )
  assert.equal(p.ok, true)
  assert.equal(p.amountToPay, 3_000_000)
  const a = p.payableLines.find((l) => l.lineId === "a")!
  assert.equal(a.salePrice, 0)
})

test("refuses when a trade-in exceeds every single line", () => {
  const p = planTradeIns([{ lineId: "a", price: 1_000_000 }], [{ id: "big", value: 1_200_000 }])
  assert.equal(p.ok, false)
  assert.equal(p.unplaceableId, "big")
})
