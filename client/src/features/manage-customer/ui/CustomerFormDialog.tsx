import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateCustomer,
  useUpdateCustomer,
  type CustomerView,
} from "@/entities/customer"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  buildCustomerFormSchema,
  type CustomerFormValues,
} from "../model/customer-form.schema"
import { CustomerFormFields } from "./CustomerFormFields"

function CustomerForm({
  customer,
  onDone,
}: {
  customer: CustomerView | null
  onDone: () => void
}) {
  const { t } = useI18n()
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const schema = React.useMemo(() => buildCustomerFormSchema(t), [t])
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      notes: customer?.notes ?? "",
      priceLevelCode: customer?.priceLevelCode ?? "RETAIL",
      standingDiscountPercent: String(Number(customer?.standingDiscountPercent ?? 0)),
    },
  })
  const pending = create.isPending || update.isPending

  const onSubmit = (values: CustomerFormValues) => {
    const dto = {
      name: values.name,
      phone: values.phone?.replace(/[\s-]/g, "") || undefined,
      notes: values.notes || undefined,
      priceLevelCode: values.priceLevelCode,
      standingDiscountPercent: Number(values.standingDiscountPercent),
    }
    const opts = {
      onSuccess: () => {
        toast.success(t("customers.saved"))
        onDone()
      },
      onError: (err: { message?: string }) =>
        toast.error(err?.message || t("common.error")),
    }
    if (customer) update.mutate({ id: customer.id, dto }, opts)
    else create.mutate(dto, opts)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 my-2">
        <CustomerFormFields form={form} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function CustomerFormDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer?: CustomerView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const editing = Boolean(customer)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("customers.editTitle") : t("customers.newTitle")}
          </DialogTitle>
          <DialogDescription>{t("customers.formHint")}</DialogDescription>
        </DialogHeader>
        {open && (
          <CustomerForm
            key={customer?.id ?? "new"}
            customer={customer ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
