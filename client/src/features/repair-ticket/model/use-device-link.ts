import * as React from "react"
import { useDeviceByImei } from "@/entities/device"
import type { UseFormReturn } from "react-hook-form"
import type { RepairFormValues } from "./repair-ticket-schema"

type Form = UseFormReturn<RepairFormValues>

const DEBOUNCE_MS = 350

/** Debounced inventory lookup for the ticket form. A found stock unit is linked
 *  once and prefills the device/model fields; the link can be undone. */
export function useDeviceLink(form: Form) {
  const code = (form.watch("imei") || form.watch("serialNumber") || "").trim()
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(code.length >= 3 ? code : ""), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [code])

  const { data: device, isFetching } = useDeviceByImei(debounced || null)
  const linkedId = form.watch("deviceId")
  const prefilled = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!device || prefilled.current === device.id) return
    prefilled.current = device.id
    form.setValue("deviceId", device.id, { shouldValidate: true })
    if (!form.getValues("deviceName")) {
      form.setValue("deviceName", `${device.model.brand} ${device.model.name}`.trim(), { shouldValidate: true })
    }
    if (!form.getValues("modelId")) form.setValue("modelId", device.modelId, { shouldValidate: true })
  }, [device, form])

  const unlink = () => {
    prefilled.current = null
    form.setValue("deviceId", "", { shouldValidate: true })
  }

  return { code, device, isFetching, linkedId, unlink }
}
