import { test } from "node:test"
import assert from "node:assert/strict"
import { isOrderTerminal, allowedOrderTransitions, canTransitionOrder } from "./order-status.ts"

test("isOrderTerminal identifies DONE and CANCELLED as terminal", () => {
  assert.equal(isOrderTerminal("NEW"), false)
  assert.equal(isOrderTerminal("CONTACTED"), false)
  assert.equal(isOrderTerminal("SHIPPED"), false)
  assert.equal(isOrderTerminal("DONE"), true)
  assert.equal(isOrderTerminal("CANCELLED"), true)
})

test("allowedOrderTransitions returns valid next statuses", () => {
  assert.deepEqual(allowedOrderTransitions("NEW"), ["CONTACTED", "CANCELLED"])
  assert.deepEqual(allowedOrderTransitions("CONTACTED", "PICKUP"), ["DONE", "CANCELLED"])
  assert.deepEqual(allowedOrderTransitions("CONTACTED", "DELIVERY"), ["SHIPPED", "DONE", "CANCELLED"])
  assert.deepEqual(allowedOrderTransitions("SHIPPED", "DELIVERY"), ["DONE", "CANCELLED"])
  assert.deepEqual(allowedOrderTransitions("DONE"), [])
  assert.deepEqual(allowedOrderTransitions("CANCELLED"), [])
})

test("canTransitionOrder validates moves accurately", () => {
  assert.equal(canTransitionOrder("NEW", "CONTACTED"), true)
  assert.equal(canTransitionOrder("NEW", "CANCELLED"), true)
  assert.equal(canTransitionOrder("NEW", "DONE"), false)
  assert.equal(canTransitionOrder("CONTACTED", "SHIPPED", "DELIVERY"), true)
  assert.equal(canTransitionOrder("CONTACTED", "SHIPPED", "PICKUP"), false)
  assert.equal(canTransitionOrder("CONTACTED", "DONE"), true)
  assert.equal(canTransitionOrder("CONTACTED", "CANCELLED"), true)
  assert.equal(canTransitionOrder("SHIPPED", "DONE"), true)
  assert.equal(canTransitionOrder("DONE", "CONTACTED"), false)
  assert.equal(canTransitionOrder("CANCELLED", "NEW"), false)
})
