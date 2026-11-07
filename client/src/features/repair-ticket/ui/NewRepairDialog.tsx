import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useCreateRepair, repairMutationError } from "@/entities/repair"
import { CustomerPicker, type CustomerSelection } from "@/entities/customer"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"
import {
  repairFormSchema,
  emptyRepairForm,
  toCreateDto,
  type RepairFormValues,
} from "../model/repair-ticket-schema"
import { RepairFields } from "./RepairFields"
import { MasterField } from "./MasterField"

function NewRepairForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const create = useCreateRepair()
  const [customer, setCustomer] = React.useState<CustomerSelection | null>(null)
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    mode: "onChange",
    defaultValues: emptyRepairForm(),
  })
  const ready = Boolean(customer) && form.formState.isValid

  const onSubmit = (v: RepairFormValues) => {
    if (!customer) return
    create.mutate(toCreateDto(v, customer), {
      onSuccess: () => {
        toast.success(t("common.success"))
        onDone()
      },
      onError: (err: Error) => {
        const { message, queued } = repairMutationError(err, t)
        if (queued) toast.success(message)
        else toast.error(message)
      },
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
      <div className="space-y-1">
        <Label>{t("repairs.customer")}</Label>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>
      <RepairFields form={form} />
      <MasterField form={form} />
      <Button type="submit" className="w-full" disabled={!ready || create.isPending}>
        {create.isPending ? t("common.loading") : t("repairs.newTicket")}
      </Button>
    </form>
  )
}

export interface NewRepairDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Take a phone in for repair (`repair.manage`). */
export function NewRepairDialog({ open, onOpenChange }: NewRepairDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("repairs.newTicketTitle")}</DialogTitle>
          <DialogDescription>{t("repairs.newTicketHint")}</DialogDescription>
        </DialogHeader>
        {open && <NewRepairForm onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
