import readXlsxFile from "read-excel-file/universal"
import type { ImportShipmentRow } from "./import-shipment.types"

interface ColumnMap {
  modelCol: number
  imeiCol: number
  imei2Col: number
  priceCol: number
  expenseCol: number
  markupCol: number
  batteryCol: number
  defectsCol: number
}

function matchHeader(cell: string): keyof ColumnMap | null {
  const norm = cell.trim().toLowerCase().replace(/\s+/g, " ")
  if (norm.includes("имей 2") || norm.includes("имей2") || norm.includes("imei 2") || norm.includes("imei2")) {
    return "imei2Col"
  }
  if (norm.includes("имей") || norm.includes("imei")) {
    return "imeiCol"
  }
  if (norm === "модель" || norm.startsWith("модель ") || norm.includes("наименование")) {
    return "modelCol"
  }
  if (norm.includes("расход")) return "expenseCol"
  if (norm.includes("цена")) return "priceCol"
  if (norm.includes("наценка")) return "markupCol"
  if (norm.includes("емкость") || norm.includes("ёмкость") || norm.includes("батаре")) return "batteryCol"
  if (norm.includes("недостат") || norm.includes("дефект")) return "defectsCol"
  return null
}

function findHeaderRow(rows: (string | number | boolean | Date | null)[][]): {
  rowIndex: number
  cols: ColumnMap
} | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cols: ColumnMap = {
      modelCol: -1,
      imeiCol: -1,
      imei2Col: -1,
      priceCol: -1,
      expenseCol: -1,
      markupCol: -1,
      batteryCol: -1,
      defectsCol: -1,
    }
    for (let j = 0; j < row.length; j++) {
      const cell = row[j]
      if (typeof cell === "string") {
        const key = matchHeader(cell)
        if (key && cols[key] === -1) {
          cols[key] = j
        }
      }
    }
    if (cols.modelCol !== -1 && cols.imeiCol !== -1 && cols.priceCol !== -1 && cols.expenseCol !== -1) {
      return { rowIndex: i, cols }
    }
  }
  return null
}

function parseNumber(val: unknown): number | undefined {
  if (val == null || val === "") return undefined
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined
  const cleaned = String(val).replace(/[^0-9.-]/g, "")
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function parseIntNumber(val: unknown): number | undefined {
  if (val == null || val === "") return undefined
  if (typeof val === "number") return Math.round(val)
  const cleaned = String(val).replace(/[^0-9]/g, "")
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : undefined
}

export function parseBatchRows(rows: (string | number | boolean | Date | null)[][]): ImportShipmentRow[] {
  const headerInfo = findHeaderRow(rows)
  if (!headerInfo) {
    throw new Error('Invalid batch sheet: missing required headers ("Модель", "Имей", "Цена", "Расход")')
  }

  const { rowIndex, cols } = headerInfo
  const items: ImportShipmentRow[] = []

  for (let i = rowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const firstNonEmpty = row.find((c) => c != null && String(c).trim() !== "")
    if (firstNonEmpty && String(firstNonEmpty).trim().toLowerCase().startsWith("итого")) {
      break
    }

    const modelName = String(row[cols.modelCol] ?? "").trim()
    const imei = String(row[cols.imeiCol] ?? "").replace(/\s+/g, "")
    if (!modelName && !imei) continue

    const imei2Raw = cols.imei2Col !== -1 ? row[cols.imei2Col] : null
    const imei2 = imei2Raw ? String(imei2Raw).replace(/\s+/g, "") : undefined

    const price = parseNumber(row[cols.priceCol]) ?? 0
    const expense = (cols.expenseCol !== -1 ? parseNumber(row[cols.expenseCol]) : 0) ?? 0
    const markup = cols.markupCol !== -1 ? parseNumber(row[cols.markupCol]) : undefined
    const batteryHealth = cols.batteryCol !== -1 ? parseIntNumber(row[cols.batteryCol]) : undefined
    const defects = cols.defectsCol !== -1 && row[cols.defectsCol] ? String(row[cols.defectsCol]).trim() : undefined

    items.push({
      row: i + 1,
      modelName,
      imei,
      imei2: imei2 || undefined,
      price,
      expense,
      markup,
      batteryHealth,
      defects: defects || undefined,
    })
  }

  if (items.length === 0) {
    throw new Error("No data rows found in batch sheet")
  }

  return items
}

function extractSheetRows(result: unknown): (string | number | boolean | Date | null)[][] {
  if (Array.isArray(result) && result.length > 0) {
    if (Array.isArray(result[0])) {
      return result as (string | number | boolean | Date | null)[][]
    }
    const first = result[0] as { data?: (string | number | boolean | Date | null)[][] }
    if (first && Array.isArray(first.data)) {
      return first.data
    }
  }
  return []
}

export async function parseBatchFile(file: File | Blob): Promise<ImportShipmentRow[]> {
  const result = await readXlsxFile(file)
  const rows = extractSheetRows(result)
  return parseBatchRows(rows)
}
