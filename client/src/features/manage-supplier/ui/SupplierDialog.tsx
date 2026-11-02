import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateSupplier,
  useUpdateSupplier,
  SupplierFormFields,
  supplierFormSchema,
  toCreateSupplierDto,
  toUpdateSupplierDto,
  type SupplierFormValues,
  type SupplierView,
} from "@/entities/supplier"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"

type FormApi = UseFormReturn<SupplierFormValues>

function ActiveField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="isActive"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <FormLabel className="mb-0">{t("shipments.supplierActive")}</FormLabel>
          <FormControl>
            <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function useSupplierSubmit(supplier: SupplierView | null, form: FormApi, onDone: () => void) {
  const { t } = useI18n()
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()

  const handleError = (err: { statusCode?: number; message?: string }) => {
    if (err?.statusCode === 409 || err?.statusCode === 400) {
      form.setError("name", { message: t("shipments.supplierDuplicate") })
      return
    }
    toast.error(err?.message || t("common.error"))
  }

  const submit = (values: SupplierFormValues) => {
    const opts = { onSuccess: () => { toast.success(t("common.success")); onDone() }, onError: handleError }
    if (supplier) updateMutation.mutate({ id: supplier.id, dto: toUpdateSupplierDto(values) }, opts)
    else createMutation.mutate(toCreateSupplierDto(values), opts)
  }

  return { submit, isPending: createMutation.isPending || updateMutation.isPending }
}

function SupplierForm({ supplier, onDone }: { supplier: SupplierView | null; onDone: () => void }) {
  const { t } = useI18n()
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      country: supplier?.country ?? "",
      contact: supplier?.contact ?? "",
      notes: supplier?.notes ?? "",
      isActive: supplier?.isActive ?? true,
    },
  })
  const { submit, isPending } = useSupplierSubmit(supplier, form, onDone)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4 my-2">
        <SupplierFormFields form={form} />
        {supplier && <ActiveField form={form} />}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function SupplierDialog({
  supplier,
  open,
  onOpenChange,
}: {
  supplier: SupplierView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? t("shipments.editSupplier") : t("shipments.newSupplier")}</DialogTitle>
        </DialogHeader>
        {open && <SupplierForm key={supplier?.id ?? "new"} supplier={supplier} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
