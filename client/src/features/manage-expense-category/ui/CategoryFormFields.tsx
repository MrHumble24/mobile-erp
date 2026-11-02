import { type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { useExpenseCategories } from "@/entities/expense-category"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { CategoryFormValues } from "../model/category-form.schema"

type FormApi = UseFormReturn<CategoryFormValues>

function PlainField({
  form,
  name,
  label,
  type,
}: {
  form: FormApi
  name: "name" | "description" | "sortOrder"
  label: string
  type?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} className="h-10" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ReassignField({ form, currentId }: { form: FormApi; currentId?: string }) {
  const { t } = useI18n()
  const { data: categories } = useExpenseCategories()
  const targets = (categories ?? []).filter(
    (c) => c.isActive && c.id !== currentId
  )
  return (
    <FormField
      control={form.control}
      name="reassignToId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("expenses.reassignTo")}</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {targets.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("expenses.reassignRequired")}
          </p>
        </FormItem>
      )}
    />
  )
}

function ActiveField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="isActive"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
          <FormLabel className="mb-0">{t("expenses.categoryActive")}</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function CategoryFormFields({
  form,
  isEdit,
  currentId,
}: {
  form: FormApi
  isEdit: boolean
  currentId?: string
}) {
  const { t } = useI18n()
  const isActive = form.watch("isActive")
  return (
    <>
      <PlainField form={form} name="name" label={t("expenses.categoryName")} />
      <PlainField form={form} name="description" label={t("expenses.description")} />
      <PlainField form={form} name="sortOrder" type="number" label={t("expenses.sortOrder")} />
      {isEdit && <ActiveField form={form} />}
      {isEdit && !isActive && <ReassignField form={form} currentId={currentId} />}
    </>
  )
}
