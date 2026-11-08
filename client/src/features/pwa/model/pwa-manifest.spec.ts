import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

test("PWA manifest has required fields and valid icons", () => {
  const manifestPath = path.resolve(process.cwd(), "public/manifest.webmanifest")
  assert.ok(fs.existsSync(manifestPath), "manifest.webmanifest must exist in public/")

  const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  assert.equal(content.start_url, "/")
  assert.equal(content.display, "standalone")
  assert.ok(content.name, "manifest must define a name")
  assert.ok(content.short_name, "manifest must define a short_name")
  assert.ok(Array.isArray(content.icons), "icons must be an array")
  assert.ok(content.icons.length >= 2, "icons must have at least 192 and 512 variants")

  const sizes = content.icons.map((i: { sizes: string }) => i.sizes)
  assert.ok(sizes.includes("192x192"), "icons must include 192x192")
  assert.ok(sizes.includes("512x512"), "icons must include 512x512")

  const purposes = content.icons.map((i: { purpose?: string }) => i.purpose)
  assert.ok(purposes.includes("maskable"), "icons must include maskable purpose")
  assert.ok(purposes.includes("any"), "icons must include any purpose")
})

test("PWA icon assets exist on disk in client/public", () => {
  const publicDir = path.resolve(process.cwd(), "public")
  const requiredIcons = [
    "pwa-192x192.png",
    "pwa-512x512.png",
    "pwa-maskable-192x192.png",
    "pwa-maskable-512x512.png",
    "apple-touch-icon.png",
    "favicon.ico",
    "favicon.svg",
  ]

  for (const icon of requiredIcons) {
    const fullPath = path.join(publicDir, icon)
    assert.ok(fs.existsSync(fullPath), `Icon asset ${icon} must exist in public/`)
    const stats = fs.statSync(fullPath)
    assert.ok(stats.size > 0, `Icon asset ${icon} must not be empty`)
  }
})

