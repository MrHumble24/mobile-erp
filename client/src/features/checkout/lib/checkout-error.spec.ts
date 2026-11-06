/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { HttpError } from "../../../shared/api/http.ts"
import { checkoutErrorKey } from "./checkout-error.ts"

test("the bonus refusals map to their till messages", () => {
  assert.equal(checkoutErrorKey("BONUS_DISABLED"), "pos.bonusErrorDisabled")
  assert.equal(checkoutErrorKey("BONUS_REDEEM_OFFLINE"), "pos.bonusErrorOffline")
})

test("the four trade-in refusals map to their till messages", () => {
  assert.equal(checkoutErrorKey("TRADE_IN_FORBIDDEN"), "pos.tradeInErrorForbidden")
  assert.equal(checkoutErrorKey("TRADE_IN_NO_CUSTOMER"), "pos.tradeInErrorNoCustomer")
  assert.equal(checkoutErrorKey("TRADE_IN_OFFLINE"), "pos.tradeInErrorOffline")
  assert.equal(checkoutErrorKey("TRADE_IN_EXCEEDS_SALE"), "pos.tradeInErrorExceedsSale")
})

test("reads the code from an error body and ignores an unknown code", () => {
  const err = new HttpError(400, "refused", undefined, { code: "TRADE_IN_OFFLINE" })
  assert.equal(checkoutErrorKey(err), "pos.tradeInErrorOffline")
  assert.equal(checkoutErrorKey("SOMETHING_ELSE"), undefined)
})
