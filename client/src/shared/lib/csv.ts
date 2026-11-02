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
    // Text starting with = + - @ tab or CR runs as a formula in Excel/Sheets; a leading
    // apostrophe neutralises it. Numbers are left alone so negatives stay numeric.
    const raw = String(cell ?? "")
    const s = typeof cell === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
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
