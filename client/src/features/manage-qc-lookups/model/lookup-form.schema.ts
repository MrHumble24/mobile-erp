import { z } from "zod"

export const lookupFormSchema = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "code-format"),
  label: z.string().min(1),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

export type LookupFormValues = z.infer<typeof lookupFormSchema>

/** `Water damage!` -> `WATER_DAMAGE`; mirrors the server UPPER_SNAKE rule. */
export function toCode(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9]+/, "")
}
