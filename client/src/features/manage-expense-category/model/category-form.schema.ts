import { z } from "zod"
import type {
  CreateExpenseCategoryDto,
  ExpenseCategoryView,
  UpdateExpenseCategoryDto,
} from "@/entities/expense-category"

export type Translate = (key: string) => string

export function makeCategorySchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t("common.required")),
    description: z.string().optional(),
    sortOrder: z.string().optional(),
    isActive: z.boolean(),
    reassignToId: z.string().optional(),
  })
}

export type CategoryFormValues = z.infer<ReturnType<typeof makeCategorySchema>>

export function toCategoryFormValues(
  category?: ExpenseCategoryView | null
): CategoryFormValues {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    sortOrder: category ? String(category.sortOrder) : "0",
    isActive: category?.isActive ?? true,
    reassignToId: "",
  }
}

function trimOrUndefined(value?: string): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

export function toCreateCategoryDto(
  values: CategoryFormValues
): CreateExpenseCategoryDto {
  return {
    name: values.name.trim(),
    description: trimOrUndefined(values.description),
    sortOrder: Number(values.sortOrder) || 0,
  }
}

export function toUpdateCategoryDto(
  values: CategoryFormValues
): UpdateExpenseCategoryDto {
  return {
    name: values.name.trim(),
    description: trimOrUndefined(values.description),
    sortOrder: Number(values.sortOrder) || 0,
    isActive: values.isActive,
    reassignToId: values.isActive ? undefined : trimOrUndefined(values.reassignToId),
  }
}
