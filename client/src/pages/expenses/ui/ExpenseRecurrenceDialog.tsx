import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateExpenseRecurrence,
  useUpdateExpenseRecurrence,
  type ExpenseRecurrenceView,
} from "@/entities/expense"
import { useExpenseCategories } from "@/entities/expense-category"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"
import {
  makeRecurrenceSchema,
  toCreateRecurrenceDto,
  toRecurrenceFormValues,
  toUpdateRecurrenceDto,
  type RecurrenceFormValues,
} from "../model/recurrence-form.schema"

type FormApi = UseFormReturn<RecurrenceFormValues>

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
              <SelectTrigger className="h-10"><SelectValue placeholder={t("expenses.category")} /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories?.filter((c) => c.isActive).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function FrequencyField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="frequency"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("expenses.frequency")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="monthly">{t("expenses.frequencyMonthly")}</SelectItem>
              <SelectItem value="weekly">{t("expenses.frequencyWeekly")}</SelectItem>
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
  type,
}: {
  form: FormApi
  name: "amount" | "vendor" | "description" | "nextDueAt"
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

function RecurrenceForm({
  recurrence,
  onDone,
}: {
  recurrence: ExpenseRecurrenceView | null
  onDone: () => void
}) {
  const { t } = useI18n()
  const form: FormApi = useForm<RecurrenceFormValues>({
    resolver: zodResolver(makeRecurrenceSchema(t)),
    defaultValues: toRecurrenceFormValues(recurrence),
  })
  const createMutation = useCreateExpenseRecurrence()
  const updateMutation = useUpdateExpenseRecurrence()
  const isPending = createMutation.isPending || updateMutation.isPending

  const opts = {
    onSuccess: () => {
      toast.success(t("expenses.recurrenceSaved"))
      onDone()
    },
    onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
  }
  const submit = (values: RecurrenceFormValues) => {
    if (recurrence) {
      updateMutation.mutate({ id: recurrence.id, dto: toUpdateRecurrenceDto(values) }, opts)
    } else {
      createMutation.mutate(toCreateRecurrenceDto(values), opts)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4 my-2">
        <CategoryField form={form} />
        <TextField form={form} name="amount" type="number" label={t("expenses.amount")} />
        <FrequencyField form={form} />
        <TextField form={form} name="nextDueAt" type="date" label={t("expenses.nextDueAt")} />
        <TextField form={form} name="vendor" label={t("expenses.vendor")} />
        <TextField form={form} name="description" label={t("expenses.description")} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function ExpenseRecurrenceDialog({
  recurrence = null,
  open,
  onOpenChange,
}: {
  recurrence?: ExpenseRecurrenceView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recurrence ? t("expenses.editRecurrence") : t("expenses.newRecurrence")}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <RecurrenceForm
            key={recurrence?.id ?? "new"}
            recurrence={recurrence}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
