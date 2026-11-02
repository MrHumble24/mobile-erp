import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { type DeviceDetailView } from "@/entities/device"
import { useCreateInspection, type LookupView } from "@/entities/qc"
import { Button } from "@/shared/ui/button"
import { Form, FormField } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  defaultDefects,
  gradeDeviceSchema,
  toPayload,
  type GradeDeviceValues,
} from "../model/grade-device.schema"
import { DeviceHeaderCard } from "./DeviceHeaderCard"
import { PassFailControl } from "./PassFailControl"
import { QcFields } from "./QcFields"
import { DefectsChecklist } from "./DefectsChecklist"

const STATUS_LABEL_KEY: Record<string, string> = {
  IN_STOCK: "inventory.statusInStock",
  DEFECTIVE: "inventory.statusDefective",
}

function resultingStatus(current: string, passed: boolean): string {
  if (!passed && current === "IN_STOCK") return "DEFECTIVE"
  if (passed && current === "DEFECTIVE") return "IN_STOCK"
  return current
}

type Form = UseFormReturn<GradeDeviceValues>

function FormFields({
  form,
  device,
  grades,
  defectTypes,
  canViewCost,
}: {
  form: Form
  device: DeviceDetailView
  grades: LookupView[]
  defectTypes: LookupView[]
  canViewCost: boolean
}) {
  return (
    <>
      <DeviceHeaderCard device={device} />
      <FormField
        control={form.control}
        name="passed"
        render={({ field }) => <PassFailControl passed={field.value} onChange={field.onChange} />}
      />
      <QcFields form={form} grades={grades} canViewCost={canViewCost} />
      <DefectsChecklist form={form} defectTypes={defectTypes} />
    </>
  )
}

function SubmitButtons({ onNext, isPending }: { onNext: () => void; isPending: boolean }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="submit" disabled={isPending}>
        {isPending ? t("common.loading") : t("common.save")}
      </Button>
      <Button type="button" variant="secondary" onClick={onNext} disabled={isPending}>
        {t("qc.inspectNext")}
      </Button>
    </div>
  )
}

export function GradeDeviceForm({
  device,
  defectTypes,
  grades,
  canViewCost,
  onDone,
  onInspectNext,
}: {
  device: DeviceDetailView
  defectTypes: LookupView[]
  grades: LookupView[]
  canViewCost: boolean
  onDone: () => void
  onInspectNext: () => void
}) {
  const { t } = useI18n()
  const createMutation = useCreateInspection()
  const form = useForm<GradeDeviceValues>({
    resolver: zodResolver(gradeDeviceSchema),
    defaultValues: {
      passed: true,
      gradeCode: "",
      batteryHealth: 100,
      repairCost: "",
      notes: "",
      defects: defaultDefects(defectTypes),
    },
  })

  const submit = (next: boolean) => (values: GradeDeviceValues) => {
    createMutation.mutate(toPayload(device.id, values), {
      onSuccess: () => {
        const status = resultingStatus(device.statusCode, values.passed)
        toast.success(t("qc.inspectionSavedStatus", { status: t(STATUS_LABEL_KEY[status] ?? status) }))
        if (next) onInspectNext()
        else onDone()
      },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit(false))} className="space-y-4 my-2">
        <FormFields form={form} device={device} grades={grades} defectTypes={defectTypes} canViewCost={canViewCost} />
        <SubmitButtons onNext={form.handleSubmit(submit(true))} isPending={createMutation.isPending} />
      </form>
    </Form>
  )
}
