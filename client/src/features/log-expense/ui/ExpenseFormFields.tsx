import { type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { useExpenseCategories } from "@/entities/expense-category"
import { AccountSelect } from "@/entities/ledger"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Switch } from "@/shared/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { ExpenseFormValues } from "../model/expense-form.schema"

type FormApi = UseFormReturn<ExpenseFormValues>

function CategoryField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  const { data: categories } = useExpenseCategories()
  return (
    <FormField
      control={form.control}
      name="categoryId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("expenses.category")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("expenses.category")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories
                ?.filter((c) => c.isActive)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function TextField({
  form,
  name,
  label,
  placeholder,
  type,
}: {
  form: FormApi
  name: "amount" | "vendor" | "description" | "incurredAt"
  label: string
  placeholder?: string
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
            <Input
              type={type}
              placeholder={placeholder}
              className="h-10"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function AccountField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="accountCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("balance.payFrom")}</FormLabel>
          <AccountSelect value={field.value} onValueChange={field.onChange} />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function RecurringField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="isRecurring"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
          <FormLabel className="mb-0">{t("expenses.isRecurring")}</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function ExpenseFormFields({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <>
      <CategoryField form={form} />
      <TextField form={form} name="amount" type="number" label={t("expenses.amount")} />
      <TextField
        form={form}
        name="incurredAt"
        type="date"
        label={t("expenses.incurredAt")}
      />
      <TextField
        form={form}
        name="vendor"
        label={t("expenses.vendor")}
        placeholder={t("expenses.vendorPlaceholder")}
      />
      <DescriptionField form={form} />
      <AccountField form={form} />
      <RecurringField form={form} />
    </>
  )
}

function DescriptionField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("expenses.description")}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={t("expenses.descriptionPlaceholder")}
              className="min-h-[72px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
