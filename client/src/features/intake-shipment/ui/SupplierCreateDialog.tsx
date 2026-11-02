import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateSupplier,
  SupplierFormFields,
  supplierFormSchema,
  toCreateSupplierDto,
  type SupplierFormValues,
} from "@/entities/supplier"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"

function SupplierCreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { t } = useI18n()
  const createMutation = useCreateSupplier()
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: { name: "", country: "", contact: "", notes: "" },
  })

  const onSubmit = (values: SupplierFormValues) => {
    createMutation.mutate(toCreateSupplierDto(values), {
      onSuccess: (sup) => { toast.success(t("common.success")); onCreated(sup.id) },
      onError: (err: { statusCode?: number; message?: string }) => {
        if (err?.statusCode === 409 || err?.statusCode === 400) {
          form.setError("name", { message: t("shipments.supplierDuplicate") })
          return
        }
        toast.error(err?.message || t("common.error"))
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <SupplierFormFields form={form} />
        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function SupplierCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("shipments.newSupplier")}</DialogTitle>
        </DialogHeader>
        {open && <SupplierCreateForm onCreated={(id) => { onCreated(id); onOpenChange(false) }} />}
      </DialogPopup>
    </Dialog>
  )
}
