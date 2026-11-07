import { test } from "node:test"
import assert from "node:assert/strict"
import { codeKey } from "./repair-error-codes.ts"

test("codeKey maps the disabled-feature code to the existing copy", () => {
  assert.equal(codeKey("REPAIRS_DISABLED"), "repairs.disabled")
})

test("codeKey maps a version conflict to the retry copy", () => {
  assert.equal(codeKey("REPAIR_VERSION_CONFLICT"), "repairs.errorVersionConflict")
})

test("codeKey leaves unknown codes to the server message", () => {
  assert.equal(codeKey("SOMETHING_ELSE"), undefined)
  assert.equal(codeKey(undefined), undefined)
})
