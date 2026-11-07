import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useUpdateRepair, repairErrorKey, type RepairView } from "@/entities/repair"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import {
  repairFormSchema,
  repairToForm,
  toUpdateDto,
  type RepairFormValues,
} from "../model/repair-ticket-schema"
import { RepairFields } from "./RepairFields"
import { MasterField } from "./MasterField"

function EditRepairForm({ repair, onDone }: { repair: RepairView; onDone: () => void }) {
  const { t } = useI18n()
  const update = useUpdateRepair(repair.id)
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    mode: "onChange",
    defaultValues: repairToForm(repair),
  })

  const onSubmit = (v: RepairFormValues) => {
    update.mutate(toUpdateDto(v), {
      onSuccess: () => {
        toast.success(t("common.success"))
        onDone()
      },
      onError: (err: Error) => {
        const key = repairErrorKey(err)
        toast.error(key ? t(key) : err.message || t("common.error"))
      },
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
      <RepairFields form={form} />
      <MasterField form={form} />
      <Button type="submit" className="w-full" disabled={!form.formState.isValid || update.isPending}>
        {update.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  )
}

export interface EditRepairDialogProps {
  repair: RepairView
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Edit a ticket's details while it is not terminal (`repair.manage`). */
export function EditRepairDialog({ repair, open, onOpenChange }: EditRepairDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("repairs.editTicket")}</DialogTitle>
          <DialogDescription>{t("repairs.editTicketHint")}</DialogDescription>
        </DialogHeader>
        {open && <EditRepairForm repair={repair} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
