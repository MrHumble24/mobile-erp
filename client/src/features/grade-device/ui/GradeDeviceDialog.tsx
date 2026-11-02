import type { ReactNode } from "react"
import { PackageX, ShieldAlert } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useDeviceByImei, type DeviceDetailView } from "@/entities/device"
import { useDefectTypes, useGrades } from "@/entities/qc"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { GradeDeviceForm } from "./GradeDeviceForm"

const INSPECTABLE = new Set(["IN_STOCK", "DEFECTIVE"])

function Centered({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="my-8 text-center space-y-3">
      {icon}
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function DialogBody({
  device,
  onDone,
  onInspectNext,
}: {
  device: DeviceDetailView
  onDone: () => void
  onInspectNext: () => void
}) {
  const { t } = useI18n()
  const canViewCost = useAuthStore((s) => s.hasPermission("device.cost.view"))
  const { data: defectTypes, isLoading: dLoading } = useDefectTypes()
  const { data: grades, isLoading: gLoading } = useGrades()

  if (dLoading || gLoading) {
    return <div className="my-8 text-center text-muted-foreground">{t("common.loading")}</div>
  }
  if (!INSPECTABLE.has(device.statusCode)) {
    return <Centered icon={<ShieldAlert className="mx-auto size-10 text-amber-500" />} text={t("qc.notInspectable")} />
  }
  return (
    <GradeDeviceForm
      device={device}
      defectTypes={defectTypes || []}
      grades={grades || []}
      canViewCost={canViewCost}
      onDone={onDone}
      onInspectNext={onInspectNext}
    />
  )
}

export function GradeDeviceDialog({
  imei,
  open,
  onOpenChange,
  onInspectNext,
}: {
  imei: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onInspectNext: () => void
}) {
  const { t } = useI18n()
  const { data: device, isLoading, isError } = useDeviceByImei(open ? imei : undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("qc.runInspection")}</DialogTitle>
          <DialogDescription className="font-mono text-sm">{imei}</DialogDescription>
        </DialogHeader>
        {isLoading && <div className="my-8 text-center text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && (isError || !device) && imei && (
          <Centered icon={<PackageX className="mx-auto size-10 text-muted-foreground" />} text={t("inventory.imeiNotFound")} />
        )}
        {device && (
          <DialogBody
            key={device.id}
            device={device}
            onDone={() => onOpenChange(false)}
            onInspectNext={onInspectNext}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
