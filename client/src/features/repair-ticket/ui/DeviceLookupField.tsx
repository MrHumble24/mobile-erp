import { Loader2, Link2, Unlink, Wrench } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { DeviceStatusBadge } from "@/entities/device"
import { Button } from "@/shared/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { RepairFormValues } from "../model/repair-ticket-schema"
import { useDeviceLink } from "../model/use-device-link"

type Form = UseFormReturn<RepairFormValues>

/** Optional IMEI/serial lookup that links the ticket to one of our own stock
 *  units. A customer's phone is not in inventory — free text stays valid. */
export function DeviceLookupField({ form }: { form: Form }) {
  const { t } = useI18n()
  const { code, device, isFetching, linkedId, unlink } = useDeviceLink(form)

  return (
    <div className="space-y-1.5 rounded-[12px] border border-border bg-muted/50 p-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <Wrench className="size-3.5 text-muted-foreground" />
        {t("repairs.deviceLookupTitle")}
      </div>
      {device ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 text-xs">
            <span className="font-semibold">{device.model.brand} {device.model.name}</span>
            <span className="ml-1 font-mono text-muted-foreground">{code}</span>
          </div>
          <div className="flex items-center gap-2">
            <DeviceStatusBadge status={device.statusCode} />
            <UnlinkButton label={t("repairs.unlinkDevice")} onClick={unlink} />
          </div>
        </div>
      ) : linkedId ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
            <Link2 className="size-3.5" />
            {t("repairs.linkedDevice")}
          </span>
          <UnlinkButton label={t("repairs.unlinkDevice")} onClick={unlink} />
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isFetching && <Loader2 className="size-3 animate-spin" />}
          {isFetching ? t("repairs.deviceLookingUp") : t("repairs.deviceLookupHint")}
        </p>
      )}
    </div>
  )
}

function UnlinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={onClick}>
      <Unlink className="size-3" />
      {label}
    </Button>
  )
}
