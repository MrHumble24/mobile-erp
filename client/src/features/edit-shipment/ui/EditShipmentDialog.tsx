import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useUpdateShipment, type ShipmentView } from "@/entities/shipment"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { editShipmentSchema, toUpdateShipmentDto, type EditShipmentValues } from "../model/edit-shipment.schema"
import { EditShipmentFields } from "./EditShipmentFields"

function EditShipmentForm({
  shipment,
  onDone,
}: {
  shipment: ShipmentView
  onDone: () => void
}) {
  const { t } = useI18n()
  const updateMutation = useUpdateShipment()
  const form = useForm<EditShipmentValues>({
    resolver: zodResolver(editShipmentSchema),
    defaultValues: {
      shipmentDate: shipment.shipmentDate.slice(0, 10),
      expectedCount: String(shipment.expectedCount),
      notes: shipment.notes ?? "",
    },
  })

  const onSubmit = (values: EditShipmentValues) => {
    updateMutation.mutate(
      { id: shipment.id, dto: toUpdateShipmentDto(values) },
      {
        onSuccess: () => { toast.success(t("common.success")); onDone() },
        onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 my-2">
        <EditShipmentFields form={form} />
        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function EditShipmentDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: ShipmentView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("shipments.editShipment")}</DialogTitle>
        </DialogHeader>
        {open && shipment && (
          <EditShipmentForm key={shipment.id} shipment={shipment} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
