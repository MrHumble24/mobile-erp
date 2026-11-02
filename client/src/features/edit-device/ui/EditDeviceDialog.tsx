import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useUpdateDevice, type DeviceView, type UpdateDeviceDto } from "@/entities/device"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { editDeviceSchema, type EditDeviceValues } from "../model/edit-device.schema"
import { EditDeviceFields } from "./EditDeviceFields"

function toDto(values: EditDeviceValues): UpdateDeviceDto {
  const tp = values.targetPrice?.trim()
  return {
    specs: {
      storage: values.storage || undefined,
      color: values.color || undefined,
      ram: values.ram || undefined,
      condition: values.condition || undefined,
    },
    targetPrice: tp ? Number(tp) : null,
  }
}

function EditDeviceForm({ device, onDone }: { device: DeviceView; onDone: () => void }) {
  const { t } = useI18n()
  const updateMutation = useUpdateDevice()
  const form = useForm<EditDeviceValues>({
    resolver: zodResolver(editDeviceSchema),
    defaultValues: {
      storage: String(device.specs?.storage ?? ""),
      color: String(device.specs?.color ?? ""),
      ram: String(device.specs?.ram ?? ""),
      condition: String(device.specs?.condition ?? ""),
      targetPrice: device.targetPrice ?? "",
    },
  })

  const onSubmit = (values: EditDeviceValues) => {
    updateMutation.mutate(
      { id: device.id, dto: toDto(values) },
      {
        onSuccess: () => {
          toast.success(t("common.success"))
          onDone()
        },
        onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 my-2">
        <EditDeviceFields form={form} />
        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function EditDeviceDialog({
  device,
  open,
  onOpenChange,
}: {
  device: DeviceView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("inventory.editDevice")}</DialogTitle>
          <DialogDescription className="font-mono text-sm">{device?.imei}</DialogDescription>
        </DialogHeader>
        {open && device && (
          <EditDeviceForm key={device.id} device={device} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
