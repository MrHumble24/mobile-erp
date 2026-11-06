/// <reference types="node" />
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(...hexToRgb(hex1))
  const l2 = getLuminance(...hexToRgb(hex2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

test("themes: all 4 themes meet WCAG AA contrast (>= 4.5:1) for body text", () => {
  const themes = [
    { name: "caldera", bg: "#ffffff", fg: "#202020", card: "#ffffff" },
    { name: "obsidian", bg: "#0f1117", fg: "#f0f2f5", card: "#181b24" },
    { name: "sand", bg: "#fcfaf6", fg: "#2c2723", card: "#ffffff" },
    { name: "nord", bg: "#242933", fg: "#eceff4", card: "#2e3440" },
  ]

  for (const th of themes) {
    const bgRatio = contrastRatio(th.bg, th.fg)
    const cardRatio = contrastRatio(th.card, th.fg)
    assert.ok(
      bgRatio >= 4.5,
      `Theme ${th.name} background contrast ${bgRatio.toFixed(2)} is below 4.5:1`
    )
    assert.ok(
      cardRatio >= 4.5,
      `Theme ${th.name} card contrast ${cardRatio.toFixed(2)} is below 4.5:1`
    )
  }
})

test("theme-tokens: arbitrary primary hex classes are not used in UI code", () => {
  const forbiddenHex = [
    "bg-[#f8f9fa]",
    "border-[#e8e8e8]",
    "text-[#202020]",
    "text-[#838383]",
    "text-[#646464]",
    "text-[#090c1d]",
  ]

  function walk(dir: string, list: string[] = []): string[] {
    const entries = readdirSync(dir)
    for (const e of entries) {
      const full = join(dir, e)
      const st = statSync(full)
      if (st.isDirectory()) {
        if (e !== "node_modules" && e !== "dist" && e !== "styles") {
          walk(full, list)
        }
      } else if (e.endsWith(".tsx")) {
        list.push(full)
      }
    }
    return list
  }

  const files = walk(join(process.cwd(), "src"))
  const violations: string[] = []

  for (const f of files) {
    const content = readFileSync(f, "utf8")
    for (const hex of forbiddenHex) {
      if (content.includes(hex)) {
        violations.push(`${f}: contains ${hex}`)
      }
    }
  }

  assert.deepEqual(violations, [], `Found forbidden raw hex classes:\n${violations.join("\n")}`)
})
