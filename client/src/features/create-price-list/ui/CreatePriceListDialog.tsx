import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useCreatePriceList, type CurrentPriceList } from "@/entities/customs"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  createPriceListSchema,
  initialValues,
  toCreateDto,
  validateRows,
  type CreatePriceListValues,
} from "../model/create-price-list.schema"
import { PriceListRowsField } from "./PriceListRowsField"

function MetaFields({ form }: { form: UseFormReturn<CreatePriceListValues> }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="effectiveAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customs.effectiveAt")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customs.note")}</FormLabel>
            <FormControl>
              <Textarea rows={1} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function PriceListForm({ current, onDone }: { current: CurrentPriceList | null; onDone: () => void }) {
  const { t } = useI18n()
  const createMutation = useCreatePriceList()
  const form = useForm<CreatePriceListValues>({
    resolver: zodResolver(createPriceListSchema),
    defaultValues: initialValues(current),
  })

  const onSubmit = (values: CreatePriceListValues) => {
    const rowError = validateRows(values.items)
    if (rowError === "empty") return toast.error(t("customs.errorNoRows"))
    if (rowError === "duplicate") return toast.error(t("customs.errorDuplicateCode"))
    createMutation.mutate(toCreateDto(values), {
      onSuccess: () => { toast.success(t("customs.listSaved")); onDone() },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <p className="text-xs text-muted-foreground">{t("customs.newListHint")}</p>
        <MetaFields form={form} />
        <PriceListRowsField form={form} />
        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? t("common.loading") : t("customs.saveList")}
        </Button>
      </form>
    </Form>
  )
}

export function CreatePriceListDialog({
  current,
  open,
  onOpenChange,
}: {
  current: CurrentPriceList | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("customs.newList")}</DialogTitle>
          <DialogDescription>{t("customs.newListHint")}</DialogDescription>
        </DialogHeader>
        {open && <PriceListForm current={current} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
