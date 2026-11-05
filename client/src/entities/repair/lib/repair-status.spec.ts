/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { allowedMoves, isLegalMove, isTerminal } from "./repair-status.ts"
import { leftToPay, isOwed, isOverpaid } from "./repair-math.ts"

test("allowedMoves offers only legal targets per status", () => {
  assert.deepEqual(allowedMoves("RECEIVED"), ["IN_REPAIR", "READY", "CANCELLED"])
  assert.deepEqual(allowedMoves("IN_REPAIR"), ["READY", "RECEIVED", "CANCELLED"])
  assert.deepEqual(allowedMoves("READY"), ["GIVEN_BACK", "IN_REPAIR", "CANCELLED"])
})

test("terminal statuses have no moves", () => {
  assert.deepEqual(allowedMoves("GIVEN_BACK"), [])
  assert.deepEqual(allowedMoves("CANCELLED"), [])
  assert.equal(isTerminal("GIVEN_BACK"), true)
  assert.equal(isTerminal("CANCELLED"), true)
  assert.equal(isTerminal("READY"), false)
})

test("isLegalMove validates a single move", () => {
  assert.equal(isLegalMove("RECEIVED", "READY"), true)
  assert.equal(isLegalMove("READY", "RECEIVED"), false)
  assert.equal(isLegalMove("GIVEN_BACK", "READY"), false)
  assert.equal(isLegalMove("unknown", "READY"), false)
})

test("leftToPay subtracts paid from the agreed price", () => {
  assert.equal(leftToPay("100.00", "40.00"), 60)
  assert.equal(leftToPay(100, 100), 0)
})

test("leftToPay avoids float drift on cents", () => {
  assert.equal(leftToPay("0.30", "0.10"), 0.2)
})

test("leftToPay goes negative when overpaid", () => {
  assert.equal(leftToPay("50.00", "80.00"), -30)
  assert.equal(isOverpaid("50", "80"), true)
  assert.equal(isOwed("50", "80"), false)
})

test("isOwed flags money still owed", () => {
  assert.equal(isOwed("100", "40"), true)
  assert.equal(isOwed("100", "100"), false)
})
