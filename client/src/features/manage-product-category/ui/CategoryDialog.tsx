import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateProductCategory,
  useUpdateProductCategory,
  type ProductCategoryView,
} from "@/entities/product-category"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { categoryFormSchema, type CategoryFormValues } from "../model/category-form.schema"

function CategoryForm({ category, onDone }: { category: ProductCategoryView | null; onDone: () => void }) {
  const { t } = useI18n()
  const createMutation = useCreateProductCategory()
  const updateMutation = useUpdateProductCategory()
  const isPending = createMutation.isPending || updateMutation.isPending
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      sortOrder: String(category?.sortOrder ?? 0),
      isActive: category?.isActive ?? true,
    },
  })

  const onError = (err: { statusCode?: number; message?: string }) => {
    if (err?.statusCode === 409) {
      form.setError("name", { message: t("catalog.errorCategoryExists") })
      return
    }
    toast.error(err?.message || t("common.error"))
  }

  const onSubmit = (values: CategoryFormValues) => {
    const sortOrder = Number(values.sortOrder) || 0
    const opts = {
      onSuccess: () => { toast.success(t("catalog.categorySaved")); onDone() },
      onError,
    }
    if (category) {
      updateMutation.mutate({ id: category.id, dto: { name: values.name, sortOrder, isActive: values.isActive } }, opts)
    } else {
      createMutation.mutate({ name: values.name, sortOrder }, opts)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("catalog.categoryName")}</FormLabel>
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("catalog.sortOrder")}</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {category && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
                <FormLabel className="mb-0">{t("inventory.modelActive")}</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: ProductCategoryView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? t("catalog.editCategory") : t("catalog.newCategory")}</DialogTitle>
        </DialogHeader>
        {open && <CategoryForm key={category?.id ?? "new"} category={category} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
