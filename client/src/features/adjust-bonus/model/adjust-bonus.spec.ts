import { test } from "node:test"
import assert from "node:assert/strict"
import { makeAdjustBonusSchema, toAdjustBonusDto } from "./adjust-bonus.schema.ts"

const schema = makeAdjustBonusSchema((key) => key)

function parse(amount: string, reason = "owner correction") {
  return schema.safeParse({ amount, reason })
}

test("a zero amount is refused", () => {
  assert.equal(parse("0").success, false)
  assert.equal(parse("0.00").success, false)
})

test("negative and decimal amounts pass", () => {
  assert.equal(parse("-10").success, true)
  assert.equal(parse("10.5").success, true)
})

test("more than two decimals is refused", () => {
  assert.equal(parse("1.234").success, false)
})

test("an empty reason is refused", () => {
  assert.equal(parse("10", "   ").success, false)
})

test("toAdjustBonusDto numbers and trims", () => {
  assert.deepEqual(toAdjustBonusDto({ amount: " -10.5 ", reason: "  fix  " }), {
    amount: -10.5,
    reason: "fix",
  })
})
