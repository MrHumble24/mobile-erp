import { test } from "node:test"
import assert from "node:assert/strict"
import { parseBatchRows } from "./parse-batch-file.ts"

function buildSampleRows() {
  const header = [
    "Model", "Модель", "Имей", "Имей 2", "Регистрировал",
    "Расход", "Кол-во", "Цена", "В долларах", "Наценка",
    "Итого", "Емкость", "Недостатки",
  ]
  const row1 = [
    "AIP15P-256", "iPhone 15 Pro 256GB", "111111111111111", "222222222222222",
    "Admin", 70, 1, 550, 423.08, 30, 523.08, 89, "scratch on screen",
  ]
  const row2 = [
    "SGS24U", "S24 Ultra", "333333333333333", null,
    "Admin", 93, 1, 600, 461.54, 50, 604.54, 95, null,
  ]
  const summary = ["Итого", null, null, null, null, 163, 2, 1150, 884.62, 80, 1127.62, null, null]
  return [["Покупка новой партии Корея"], header, row1, row2, summary]
}

test("parseBatchRows parses batch sheet skipping title row and stops at Итого", () => {
  const items = parseBatchRows(buildSampleRows())
  assert.equal(items.length, 2)
  assert.deepEqual(items[0], {
    row: 3,
    modelName: "iPhone 15 Pro 256GB",
    imei: "111111111111111",
    imei2: "222222222222222",
    price: 550,
    expense: 70,
    markup: 30,
    batteryHealth: 89,
    defects: "scratch on screen",
  })
  assert.deepEqual(items[1], {
    row: 4,
    modelName: "S24 Ultra",
    imei: "333333333333333",
    imei2: undefined,
    price: 600,
    expense: 93,
    markup: 50,
    batteryHealth: 95,
    defects: undefined,
  })
})

test("parseBatchRows throws when required headers are missing", () => {
  assert.throws(
    () => parseBatchRows([["H1", "H2"], ["V1", "V2"]]),
    /Invalid batch sheet: missing required headers/
  )
})

test("pads a numeric IMEI that lost its leading zero in Excel", () => {
  const rows = [
    ["Модель", "Имей", "Расход", "Цена"],
    ["iPhone 13 Pro Max 256 GB", 13339414137676, 70, 550],
  ]
  const [r] = parseBatchRows(rows as never)
  assert.equal(r.imei, "013339414137676")
})
