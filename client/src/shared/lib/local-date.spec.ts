/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"

process.env.TZ = "Asia/Tashkent"

const { localDayEnd, localDayStart, todayIso } = await import("./local-date.ts")
const { presetDates } = await import("./date-range.ts")

const now = new Date("2026-11-05T19:30:00Z")

test("todayIso uses the local calendar day", () => {
  assert.equal(todayIso(now), "2026-11-06")
})

test("presetDates computes local-day bounds", () => {
  assert.deepEqual(presetDates("today", "", "", now), {
    fromDate: "2026-11-06",
    toDate: "2026-11-06",
  })
  assert.deepEqual(presetDates("7d", "", "", now), {
    fromDate: "2026-10-31",
    toDate: "2026-11-06",
  })
  assert.deepEqual(presetDates("30d", "", "", now), {
    fromDate: "2026-10-08",
    toDate: "2026-11-06",
  })
  assert.deepEqual(presetDates("month", "", "", now), {
    fromDate: "2026-11-01",
    toDate: "2026-11-06",
  })
  assert.deepEqual(presetDates("lastMonth", "", "", now), {
    fromDate: "2026-10-01",
    toDate: "2026-10-31",
  })
  assert.deepEqual(presetDates("custom", "2026-01-02", "2026-03-04", now), {
    fromDate: "2026-01-02",
    toDate: "2026-03-04",
  })
})

test("localDayStart/localDayEnd are the UTC instants of the local day", () => {
  assert.equal(localDayStart("2026-11-06"), "2026-11-05T19:00:00.000Z")
  assert.equal(localDayEnd("2026-11-06"), "2026-11-06T18:59:59.999Z")
  assert.equal(localDayStart(""), undefined)
  assert.equal(localDayEnd(""), undefined)
})

test("an afternoon now keeps the same local day and last month", () => {
  const afternoon = new Date("2026-11-06T10:00:00Z")
  assert.equal(todayIso(afternoon), "2026-11-06")
  assert.deepEqual(presetDates("lastMonth", "", "", afternoon), {
    fromDate: "2026-10-01",
    toDate: "2026-10-31",
  })
})
