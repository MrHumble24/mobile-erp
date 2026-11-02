/**
 * Client-side CSV download. UTF-8 BOM + `;` separator so Excel in the UZ/RU
 * locale opens it with correct columns and Cyrillic/Latin text intact.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  const escape = (cell: string | number): string => {
    const s = String(cell ?? "")
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers, ...rows].map((r) => r.map(escape).join(";"))
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
