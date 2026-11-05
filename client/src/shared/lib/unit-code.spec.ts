/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { unitCode } from "./unit-code.ts"

test("unitCode shows the imei, else the serial, else empty", () => {
  assert.equal(unitCode({ imei: "358249091234567", serialNumber: null }), "358249091234567")
  assert.equal(unitCode({ imei: null, serialNumber: "CFI-2000X" }), "CFI-2000X")
  assert.equal(unitCode({ imei: null, serialNumber: null }), "")
  assert.equal(unitCode({}), "")
})
