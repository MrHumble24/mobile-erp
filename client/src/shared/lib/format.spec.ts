/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { formatMoney, formatBytes, setCurrencyConfig } from "./format.ts"

test("formatMoney: exact figure, cents only when present, nullish → -", () => {
  setCurrencyConfig({ code: "USD", sign: "$", signPosition: "before", decimals: 2 })
  assert.equal(formatMoney(1250), "$1,250")
  assert.equal(formatMoney("1250.5"), "$1,250.50")
  assert.equal(formatMoney(9999999999.99), "$9,999,999,999.99")
  assert.equal(formatMoney(-500000), "-$500,000")
  assert.equal(formatMoney(null), "-")
  assert.equal(formatMoney(""), "-")
  assert.equal(formatMoney("nope"), "-")
})

test("formatMoney: dynamic currency config (UZS with sign after and 0 decimals)", () => {
  setCurrencyConfig({ code: "UZS", sign: "so'm", signPosition: "after", decimals: 0 })
  assert.equal(formatMoney(500000), "500,000 so'm")
  assert.equal(formatMoney(-15000), "-15,000 so'm")
  setCurrencyConfig({ code: "USD", sign: "$", signPosition: "before", decimals: 2 })
})

test("formatBytes: scales to KB/MB/GB, nullish → -", () => {
  assert.equal(formatBytes(0), "0 B")
  assert.equal(formatBytes(512), "512 B")
  assert.equal(formatBytes(1024), "1 KB")
  assert.equal(formatBytes(372018), "363 KB")
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB")
  assert.equal(formatBytes(2 * 1024 * 1024 * 1024), "2.0 GB")
  assert.equal(formatBytes(null), "-")
  assert.equal(formatBytes(undefined), "-")
})
})
