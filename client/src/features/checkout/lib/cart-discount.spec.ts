/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { cartDiscountCents, spreadCartDiscount } from "./cart-discount.ts"

test("spread over three awkward prices adds up exactly to the cart discount", () => {
  // Lines 333.33 / 666.67 / 1000.00 (cents), discount 100.00 (10000 cents)
  const lines = [33333, 66667, 100000]
  const discount = 10000
  const parts = spreadCartDiscount(lines, discount)
  assert.equal(parts.reduce((s, p) => s + p, 0), discount)
  // raw 1666.65 / 3333.35 / 5000 → floors 1666/3333/5000, the +1 goes to the largest fraction (line 0)
  assert.deepEqual(parts, [1667, 3333, 5000])
})

test("spread never exceeds the cart list total", () => {
  const lines = [1000, 2000]
  const parts = spreadCartDiscount(lines, 999999)
  assert.equal(parts.reduce((s, p) => s + p, 0), 3000)
})

test("lines with no list price (zero) get nothing", () => {
  const parts = spreadCartDiscount([0, 5000, 0], 1000)
  assert.deepEqual(parts, [0, 1000, 0])
})

test("cartDiscountCents: percent and amount, capped at the list total", () => {
  assert.equal(cartDiscountCents(100000, { mode: "PERCENT", value: 10 }), 10000)
  assert.equal(cartDiscountCents(100000, { mode: "AMOUNT", value: 500 }), 50000)
  assert.equal(cartDiscountCents(100000, { mode: "AMOUNT", value: 5000 }), 100000)
  assert.equal(cartDiscountCents(100000, null), 0)
})
