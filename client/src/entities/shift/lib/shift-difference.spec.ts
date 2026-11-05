/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { shiftDifference, differenceKind } from "./shift-difference.ts"

test("shiftDifference subtracts expected from counted at 2 dp", () => {
  assert.equal(shiftDifference("100.00", "100.00"), "0.00")
  assert.equal(shiftDifference("90.50", "100.00"), "-9.50")
  assert.equal(shiftDifference("110.25", "100.00"), "10.25")
})

test("shiftDifference avoids binary float drift", () => {
  // 0.1 + 0.2 territory: 100.10 − 100.00 must be exactly 0.10, not 0.099999…
  assert.equal(shiftDifference(100.1, 100), "0.10")
  assert.equal(shiftDifference("0.30", "0.10"), "0.20")
})

test("shiftDifference accepts numbers or strings", () => {
  assert.equal(shiftDifference(250, "100"), "150.00")
})

test("differenceKind classifies none / short / over", () => {
  assert.equal(differenceKind("0.00"), "none")
  assert.equal(differenceKind("-0.01"), "short")
  assert.equal(differenceKind("5.00"), "over")
})
