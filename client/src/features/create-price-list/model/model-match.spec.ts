import { test } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeCustomsKey,
  baseCustomsKey,
  isModelLinkedToRow,
  matchModelsForRow,
  autoLinkFromCodes,
  mergePendingLinks,
  assignmentsFromLinks,
  rowMatchView,
} from "./model-match.ts"

function model(id: string, brand: string, name: string, customsCode: string | null = null) {
  return {
    id,
    brand,
    name,
    customsCode,
    isActive: true,
    kindCode: "IMEI" as const,
    categoryId: null,
    barcode: null,
    modelCode: null,
    salePrice: null,
    imageUrl: null,
    attributes: [],
    createdAt: "",
    updatedAt: "",
  }
}

test("normalizeCustomsKey upper-cases, collapses spaces and tightens storage", () => {
  assert.equal(normalizeCustomsKey("iphone  15 pro 256 GB "), "IPHONE 15 PRO 256GB")
  assert.equal(normalizeCustomsKey("Galaxy A54  1 tb"), "GALAXY A54 1TB")
})

test("baseCustomsKey strips a trailing storage token", () => {
  assert.equal(baseCustomsKey("iPhone 15 Pro 256 GB"), "IPHONE 15 PRO")
  assert.equal(baseCustomsKey("iPhone 15 Pro"), "IPHONE 15 PRO")
})

test("isModelLinkedToRow accepts exact and base keys", () => {
  const linked = model("m1", "Apple", "iPhone 15 Pro", "IPHONE 15 PRO")
  assert.ok(isModelLinkedToRow(linked, "iphone 15 pro 256gb"))
  assert.ok(isModelLinkedToRow(linked, "IPHONE 15 PRO"))
  assert.ok(!isModelLinkedToRow(linked, "GALAXY A54"))
})

test("matchModelsForRow marks suggest / conflict / linked", () => {
  const models = [
    model("free", "Apple", "iPhone 15 Pro", null),
    model("coded", "Apple", "iPhone 16", "IP-16"),
  ]
  assert.deepEqual(
    matchModelsForRow("iPhone 15 Pro 256 GB", models).map((m) => [m.model.id, m.status]),
    [["free", "suggest"]]
  )
  assert.deepEqual(
    matchModelsForRow("iPhone 16 128GB", models).map((m) => [m.model.id, m.status]),
    [["coded", "conflict"]]
  )
  // A model already carrying this exact row's code shows as linked.
  const linkedRow = matchModelsForRow("iPhone 15 Pro 128 gb", [
    model("m1", "Apple", "iPhone 15 Pro", "iphone 15 pro 128 gb"),
  ])
  assert.deepEqual(
    linkedRow.map((m) => [m.model.id, m.status]),
    [["m1", "linked"]]
  )
})

test("autoLinkFromCodes links only code-less active models, first code wins", () => {
  const models = [
    model("a", "Apple", "iPhone 15 Pro", null),
    model("b", "Apple", "iPhone 15 Pro Plus", null),
    model("c", "Apple", "iPhone 16", "IP-16"),
    { ...model("d", "Apple", "iPhone 15 Pro", null), isActive: false },
  ]
  const out = autoLinkFromCodes(["iPhone 15 Pro 256GB", "IPHONE 15 PRO PLUS"], models)
  assert.deepEqual(out, {
    "IPHONE 15 PRO 256GB": ["a"],
    "IPHONE 15 PRO PLUS": ["b"],
  })
})

test("autoLinkFromCodes honours an exclusion set (one model, one code)", () => {
  const models = [model("a", "Apple", "iPhone 15 Pro", null)]
  const out = autoLinkFromCodes(["iPhone 15 Pro 256GB"], models, new Set(["a"]))
  assert.deepEqual(out, {})
})

test("assignmentsFromLinks drops vanished rows, de-duplicates and strips storage", () => {
  const items = [{ customsCode: "iPhone 15 Pro 256 GB" }, { customsCode: "iPhone 15 Pro 128 GB" }]
  const pending = {
    "IPHONE 15 PRO 256GB": ["a", "b"],
    "GHOST ROW": ["c"],
  }
  const out = assignmentsFromLinks(pending, items)
  assert.deepEqual(out, [
    { modelId: "a", customsCode: "IPHONE 15 PRO" },
    { modelId: "b", customsCode: "IPHONE 15 PRO" },
  ])
})

test("mergePendingLinks unions ids per key without duplicates", () => {
  const merged = mergePendingLinks(
    { K1: ["a"], K2: ["a"] },
    { K1: ["b", "a"], K3: ["c"] }
  )
  assert.deepEqual(merged, {
    K1: ["a", "b"],
    K2: ["a"],
    K3: ["c"],
  })
})

test("rowMatchView separates linked, suggestions and conflicts", () => {
  const models = [
    model("free", "Apple", "iPhone 15 Pro", null),
    model("coded", "Apple", "iPhone 15 Pro", "OLD-CODE"),
    model("linked", "Samsung", "Galaxy A54", "iphone 15 pro 256gb"),
  ]
  const view = rowMatchView("iPhone 15 Pro 256 GB", models, [])
  assert.deepEqual(view.linked.map((m) => m.id), ["linked"])
  assert.deepEqual(view.suggestions.map((m) => m.id), ["free"])
  assert.deepEqual(view.conflicts.map((m) => m.id), ["coded"])
  assert.ok(view.hasAny)
})

test("rowMatchView surfaces pending links and excludes them from suggestions", () => {
  const models = [model("free", "Apple", "iPhone 15 Pro", null)]
  const view = rowMatchView("iPhone 15 Pro 256 GB", models, ["free"])
  assert.deepEqual(view.pendingModels.map((m) => m.id), ["free"])
  assert.deepEqual(view.suggestions, [])
  assert.ok(view.excludeIds.has("free"))
})
