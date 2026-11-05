/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { allocateSplit, buildCartPayments, cartTotal, isPaymentBlocked } from "./payment.ts"

const lines = [
  { lineId: "a", salePrice: 500 },
  { lineId: "b", salePrice: 700 },
]

test("split straddles the cash/card boundary, each sale sums to its own price", () => {
  const parts = [
    { accountCode: "CASH", amount: 800 },
    { accountCode: "CARD", amount: 400 },
  ]
  assert.deepEqual(allocateSplit(lines, parts), {
    a: [{ accountCode: "CASH", amount: 500 }],
    b: [
      { accountCode: "CASH", amount: 300 },
      { accountCode: "CARD", amount: 400 },
    ],
  })
})

test("cent-exact: a split that does not divide evenly still sums per line", () => {
  const parts = [
    { accountCode: "CASH", amount: 0.5 },
    { accountCode: "CARD", amount: 0.25 },
  ]
  const alloc = allocateSplit(
    [
      { lineId: "a", salePrice: 0.3 },
      { lineId: "b", salePrice: 0.45 },
    ],
    parts
  )
  const sum = (ps: { amount: number }[]) => ps.reduce((s, p) => s + p.amount, 0)
  assert.equal(sum(alloc.a), 0.3)
  assert.equal(sum(alloc.b), 0.45)
})

test("cash omits payments, card posts one CARD line per sale", () => {
  assert.deepEqual(buildCartPayments(lines, "cash", []), { a: undefined, b: undefined })
  assert.deepEqual(buildCartPayments(lines, "card", []), {
    a: [{ accountCode: "CARD", amount: 500 }],
    b: [{ accountCode: "CARD", amount: 700 }],
  })
})

test("isPaymentBlocked only when a split does not add up to the cart total", () => {
  assert.equal(isPaymentBlocked(lines, "cash", []), false)
  assert.equal(
    isPaymentBlocked(lines, "split", [
      { accountCode: "CASH", amount: 800 },
      { accountCode: "CARD", amount: 400 },
    ]),
    false
  )
  assert.equal(
    isPaymentBlocked(lines, "split", [{ accountCode: "CASH", amount: 800 }]),
    true
  )
})

test("mixed cart: a phone + a quantity line split across cash/card, each line sums right", () => {
  // The amounts-to-pay the till computed: phone 500, 3 cables 105. Total 605.
  const prices = [
    { lineId: "phone", salePrice: 500 },
    { lineId: "cables", salePrice: 105 },
  ]
  assert.equal(cartTotal(prices), 605)

  const parts = [
    { accountCode: "CASH", amount: 300 },
    { accountCode: "CARD", amount: 305 },
  ]
  assert.equal(isPaymentBlocked(prices, "split", parts), false)

  const alloc = allocateSplit(prices, parts)
  const sum = (ps: { amount: number }[]) => ps.reduce((s, p) => s + p.amount, 0)
  // Each line's payments must sum to its own total — what the server checks.
  assert.equal(sum(alloc.phone), 500)
  assert.equal(sum(alloc.cables), 105)
  // The phone straddles the cash/card boundary (300 cash + 200 card).
  assert.deepEqual(alloc.phone, [
    { accountCode: "CASH", amount: 300 },
    { accountCode: "CARD", amount: 200 },
  ])
  assert.deepEqual(alloc.cables, [{ accountCode: "CARD", amount: 105 }])
})

test("a line's discounted amount-to-pay feeds the split", () => {
  // List 1000 at WHOLESALE − 10% = 900 (see discount.spec); 900 is what the split covers.
  const prices = [{ lineId: "p", salePrice: 900 }]
  assert.equal(cartTotal(prices), 900)

  const parts = [
    { accountCode: "CASH", amount: 400 },
    { accountCode: "CARD", amount: 500 },
  ]
  assert.equal(isPaymentBlocked(prices, "split", parts), false)
  const alloc = allocateSplit(prices, parts)
  const sum = (ps: { amount: number }[]) => ps.reduce((s, p) => s + p.amount, 0)
  assert.equal(sum(alloc.p), 900)
})
