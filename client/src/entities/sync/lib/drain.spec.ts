/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { planDrain, pendingFirst } from "./drain.ts"
import type { MutationResult, OutboxEntry } from "../model/sync.types.ts"

function entry(id: string, over: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    id,
    type: "sale.create",
    payload: {},
    occurredAt: "2026-01-01T00:00:00.000Z",
    status: "pending",
    attempts: 0,
    ...over,
  }
}

test("pendingFirst keeps only pending, ordered by occurredAt", () => {
  const entries = [
    entry("b", { occurredAt: "2026-01-02T00:00:00.000Z" }),
    entry("r", { status: "rejected" }),
    entry("a", { occurredAt: "2026-01-01T00:00:00.000Z" }),
  ]
  assert.deepEqual(
    pendingFirst(entries).map((e) => e.id),
    ["a", "b"],
  )
})

test("applied and duplicate are removed", () => {
  const entries = [entry("a"), entry("b")]
  const results: MutationResult[] = [
    { id: "a", status: "applied" },
    { id: "b", status: "duplicate" },
  ]
  const plan = planDrain(entries, results)
  assert.deepEqual(plan.remove, ["a", "b"])
  assert.deepEqual(plan.reject, [])
  assert.deepEqual(plan.conflictIds, [])
})

test("rejected is retained with its error, not removed", () => {
  const plan = planDrain(
    [entry("a")],
    [{ id: "a", status: "rejected", error: "insufficient permission" }],
  )
  assert.deepEqual(plan.remove, [])
  assert.deepEqual(plan.reject, [{ id: "a", error: "insufficient permission" }])
})

test("a mutation rejected as before the reset is dropped, not retained", () => {
  const plan = planDrain(
    [entry("a"), entry("b")],
    [
      { id: "a", status: "rejected", error: "MUTATION_BEFORE_RESET" },
      { id: "b", status: "rejected", error: "insufficient permission" },
    ],
  )
  assert.deepEqual(plan.remove, ["a"])
  assert.deepEqual(plan.reject, [{ id: "b", error: "insufficient permission" }])
})

test("conflict is removed and its conflictId collected", () => {
  const plan = planDrain(
    [entry("a")],
    [{ id: "a", status: "conflict", conflictId: "c1" }],
  )
  assert.deepEqual(plan.remove, ["a"])
  assert.deepEqual(plan.conflictIds, ["c1"])
})

test("a result with no matching entry is ignored; order is preserved", () => {
  const entries = [entry("a"), entry("b")]
  const results: MutationResult[] = [
    { id: "b", status: "applied" },
    { id: "ghost", status: "applied" },
    { id: "a", status: "conflict", conflictId: "c9" },
  ]
  const plan = planDrain(entries, results)
  assert.deepEqual(plan.remove, ["a", "b"])
  assert.deepEqual(plan.conflictIds, ["c9"])
})
