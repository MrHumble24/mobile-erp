import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { unitCode } from "@/shared/lib/unit-code"
import { useUpdateDevice, type DeviceView, type UpdateDeviceDto } from "@/entities/device"
import {
  useDeviceModelAttributes,
  type AttributeDef,
  type SpecFieldProblem,
} from "@/entities/device-model"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { buildEditDeviceSchema, type EditDeviceValues } from "../model/edit-device.schema"
import { EditDeviceFields } from "./EditDeviceFields"

function initialSpecs(device: DeviceView, attributes: AttributeDef[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const attr of attributes) {
    const raw = device.specs?.[attr.key]
    out[attr.key] = raw === undefined || raw === null ? "" : String(raw)
  }
  return out
}

function toDto(values: EditDeviceValues, attributes: AttributeDef[]): UpdateDeviceDto {
  const specs: Record<string, unknown> = {}
  for (const attr of attributes) {
    const value = values.specs[attr.key]?.trim() ?? ""
    if (value === "") continue
    specs[attr.key] = attr.type === "number" ? Number(value) : value
  }
  const tp = values.targetPrice?.trim()
  const imei2 = values.dualSim ? values.imei2?.trim() : ""
  return { specs, targetPrice: tp ? Number(tp) : null, imei2: imei2 ? imei2 : null }
}

function EditDeviceForm({
  device,
  attributes,
  onDone,
}: {
  device: DeviceView
  attributes: AttributeDef[]
  onDone: () => void
}) {
  const { t } = useI18n()
  const updateMutation = useUpdateDevice()
  const [problems, setProblems] = React.useState<SpecFieldProblem[]>([])
  const form = useForm<EditDeviceValues>({
    resolver: zodResolver(buildEditDeviceSchema(device.imei ?? "", t)),
    defaultValues: {
      specs: initialSpecs(device, attributes),
      targetPrice: device.targetPrice ?? "",
      dualSim: !!device.imei2,
      imei2: device.imei2 ?? "",
    },
  })

  const onSubmit = (values: EditDeviceValues) => {
    setProblems([])
    updateMutation.mutate(
      { id: device.id, dto: toDto(values, attributes) },
      {
        onSuccess: () => {
          toast.success(t("common.success"))
          onDone()
        },
        onError: (err: { message?: string; data?: unknown }) => {
          const list = (err?.data as { problems?: SpecFieldProblem[] })?.problems
          if (list?.length) setProblems(list)
          else toast.error(err?.message || t("common.error"))
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 my-2">
        <EditDeviceFields
          form={form}
          attributes={attributes}
          problems={problems}
          allowDualSim={Boolean(device.imei)}
        />
        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

function EditDeviceBody({ device, onDone }: { device: DeviceView; onDone: () => void }) {
  const { t } = useI18n()
  const { attributes, isLoading } = useDeviceModelAttributes(device.modelId)
  if (isLoading) {
    return <div className="my-8 text-center text-muted-foreground">{t("common.loading")}</div>
  }
  return <EditDeviceForm device={device} attributes={attributes} onDone={onDone} />
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
          <DialogDescription className="font-mono text-sm">{device ? unitCode(device) : ""}</DialogDescription>
        </DialogHeader>
        {open && device && (
          <EditDeviceBody key={device.id} device={device} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
