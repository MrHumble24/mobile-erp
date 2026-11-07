import readXlsxFile from "read-excel-file/universal"
import type { PriceListRow } from "./create-price-list.schema.ts"

function isModelHeader(val: string): boolean {
  return val.toLowerCase().replace(/\s+/g, " ").includes("модель")
}

function isFeeHeader(val: string): boolean {
  const norm = val.toLowerCase().replace(/\s+/g, " ")
  return norm.includes("цена расстаможки") || norm.includes("цена растаможки")
}

export function parseCustomsRows(rows: (string | number | boolean | Date | null)[][]): PriceListRow[] {
  let headerRowIndex = -1
  let modelCol = -1
  let feeCol = -1

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    for (let j = 0; j < row.length; j++) {
      const cell = row[j]
      if (typeof cell === "string") {
        if (isModelHeader(cell)) modelCol = j
        if (isFeeHeader(cell)) feeCol = j
      }
    }
    if (modelCol !== -1 && feeCol !== -1) {
      headerRowIndex = i
      break
    }
    modelCol = -1
    feeCol = -1
  }

  if (headerRowIndex === -1 || modelCol === -1 || feeCol === -1) {
    throw new Error('Invalid file format: expected headers "Модель" and "Цена Расстаможки"')
  }

  const items: PriceListRow[] = []
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const rawModel = row[modelCol]
    const rawFee = row[feeCol]
    if (rawModel == null && rawFee == null) continue

    const customsCode = String(rawModel ?? "").trim()
    if (!customsCode) continue

    const fee = rawFee != null ? String(rawFee).trim() : ""
    items.push({
      customsCode,
      description: "",
      fee,
    })
  }

  if (items.length === 0) {
    throw new Error("No data rows found in price list file")
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

export async function parseCustomsPriceListFile(file: File | Blob): Promise<PriceListRow[]> {
  const result = await readXlsxFile(file)
  const rows = extractSheetRows(result)
  return parseCustomsRows(rows)
}
