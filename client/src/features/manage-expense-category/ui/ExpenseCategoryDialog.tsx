import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  type ExpenseCategoryView,
} from "@/entities/expense-category"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  makeCategorySchema,
  toCategoryFormValues,
  toCreateCategoryDto,
  toUpdateCategoryDto,
  type CategoryFormValues,
} from "../model/category-form.schema"
import { CategoryFormFields } from "./CategoryFormFields"

type FormApi = UseFormReturn<CategoryFormValues>

function useCategorySubmit(
  category: ExpenseCategoryView | null,
  form: FormApi,
  onDone: () => void
) {
  const { t } = useI18n()
  const createMutation = useCreateExpenseCategory()
  const updateMutation = useUpdateExpenseCategory()

  const opts = {
    onSuccess: () => {
      toast.success(t("expenses.categorySaved"))
      onDone()
    },
    onError: (err: { statusCode?: number; message?: string }) => {
      if (err?.statusCode === 409 && !form.getValues("isActive")) {
        form.setError("reassignToId", { message: t("expenses.reassignRequired") })
        return
      }
      toast.error(err?.message || t("common.error"))
    },
  }

  const submit = (values: CategoryFormValues) => {
    if (category) {
      updateMutation.mutate({ id: category.id, dto: toUpdateCategoryDto(values) }, opts)
    } else {
      createMutation.mutate(toCreateCategoryDto(values), opts)
    }
  }

  return { submit, isPending: createMutation.isPending || updateMutation.isPending }
}

function CategoryForm({
  category,
  onDone,
}: {
  category: ExpenseCategoryView | null
  onDone: () => void
}) {
  const { t } = useI18n()
  const form: FormApi = useForm<CategoryFormValues>({
    resolver: zodResolver(makeCategorySchema(t)),
    defaultValues: toCategoryFormValues(category),
  })
  const { submit, isPending } = useCategorySubmit(category, form, onDone)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4 my-2">
        <CategoryFormFields form={form} isEdit={Boolean(category)} currentId={category?.id} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function ExpenseCategoryDialog({
  category = null,
  open,
  onOpenChange,
}: {
  category?: ExpenseCategoryView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? t("expenses.editCategory") : t("expenses.newCategory")}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <CategoryForm
            key={category?.id ?? "new"}
            category={category}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
