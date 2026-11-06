/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { returnErrorKey } from "./return-error.ts"

test("a unit bought back has its own message", () => {
  assert.equal(returnErrorKey("SALE_UNIT_BOUGHT_BACK"), "sales.returnBoughtBack")
})

test("the trade-in part refused has its own message", () => {
  assert.equal(returnErrorKey("TRADE_IN_REFUND_FORBIDDEN"), "sales.returnTradeInForbidden")
})

test("any other or missing code keeps the generic 409 text", () => {
  assert.equal(returnErrorKey("ANOTHER_CONFLICT"), undefined)
  assert.equal(returnErrorKey(undefined), undefined)
})
