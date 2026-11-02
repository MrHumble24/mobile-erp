import { z } from "zod"
import type { AttributeDef } from "@/entities/device-model"

export const RESERVED_STORAGE_KEY = "storage"

/** Slugify a label/key to `[a-z][a-zA-Z0-9]*` (mirrors the server rule). */
export function slugKey(raw: string): string {
  const words = raw.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (words.length === 0) return ""
  const [first, ...rest] = words
  const camel =
    first.toLowerCase() +
    rest.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("")
  return camel.replace(/^[^a-z]+/, "")
}

const attributeSchema = z.object({
  key: z.string(),
  label: z.string().min(1),
  type: z.enum(["text", "number", "select"]),
  options: z.array(z.string()),
  required: z.boolean(),
})

export const deviceModelFormSchema = z.object({
  brand: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean(),
  attributes: z.array(attributeSchema).superRefine((attrs, ctx) => {
    const seen = new Set<string>()
    attrs.forEach((a, i) => {
      const key = slugKey(a.key || a.label)
      if (!key) {
        ctx.addIssue({ code: "custom", message: "Invalid key", path: [i, "key"] })
        return
      }
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: "Duplicate key", path: [i, "key"] })
      }
      seen.add(key)
    })
  }),
})

export type ModelAttributeValue = z.infer<typeof attributeSchema>
export type DeviceModelFormValues = z.infer<typeof deviceModelFormSchema>

/** Scaffold shown when creating a brand-new model. */
export function defaultFormAttributes(): ModelAttributeValue[] {
  return [
    { key: "storage", label: "Storage", type: "select", options: [], required: true },
    { key: "color", label: "Color", type: "select", options: [], required: false },
  ]
}

/** Map a model's stored attributes → editor rows (sorted, sortOrder dropped). */
export function toFormAttributes(attrs: AttributeDef[]): ModelAttributeValue[] {
  return [...attrs]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => ({
      key: a.key,
      label: a.label,
      type: a.type,
      options: a.options,
      required: a.required,
    }))
}

/** Map editor rows → DTO attributes; array order becomes sortOrder. */
export function toDtoAttributes(attrs: ModelAttributeValue[]): AttributeDef[] {
  return attrs.map((a, i) => ({
    key: slugKey(a.key || a.label),
    label: a.label,
    type: a.type,
    options: a.type === "select" ? a.options : [],
    required: a.required,
    sortOrder: (i + 1) * 10,
  }))
}
