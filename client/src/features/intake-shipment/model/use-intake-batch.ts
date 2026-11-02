import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAddShipmentDevices, type RegisterDeviceItem, type RegisteredDeviceView } from "@/entities/shipment"
import type { IntakeDraft } from "../ui/DeviceIntakeForm"

const EMPTY_DRAFT: IntakeDraft = { imei: "", modelId: "", storage: "128GB", color: "", cost: 0, targetPrice: 0 }

function findImeiInMessage(message: string | undefined): string | null {
  const match = message?.match(/\d{15}/)
  return match ? match[0] : null
}

/** Owns the scan-and-add batch, its validation and the add-devices mutation. */
export function useIntakeBatch(shipmentId: string) {
  const { t } = useI18n()
  const addDevices = useAddShipmentDevices()
  const [draft, setDraft] = React.useState<IntakeDraft>(EMPTY_DRAFT)
  const [batch, setBatch] = React.useState<RegisterDeviceItem[]>([])
  const [errorMsg, setErrorMsg] = React.useState("")
  const [errorImei, setErrorImei] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<RegisteredDeviceView[]>([])

  const setField: <K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) => void = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrorMsg("")
  }

  const addDraft = () => {
    const imei = draft.imei.trim()
    if (!/^\d{15}$/.test(imei)) return setErrorMsg(t("shipments.imeiLength"))
    if (batch.some((b) => b.imei === imei)) return setErrorMsg(t("shipments.duplicateImei"))
    if (!draft.modelId) return setErrorMsg(t("shipments.selectModel"))
    setErrorMsg("")
    setBatch((p) => [
      ...p,
      {
        imei,
        modelId: draft.modelId,
        specs: { storage: draft.storage, color: draft.color },
        acquisitionCost: draft.cost,
        targetPrice: draft.targetPrice,
      },
    ])
    setDraft((d) => ({ ...d, imei: "" }))
  }

  const removeAt = (index: number) => setBatch((p) => p.filter((_, i) => i !== index))

  const submit = () => {
    if (batch.length === 0) return
    setErrorImei(null)
    addDevices.mutate(
      { id: shipmentId, dto: { devices: batch } },
      {
        onSuccess: (res) => { setResults(res); setBatch([]); setErrorMsg("") },
        onError: (err: { message?: string }) => {
          setErrorMsg(err?.message || t("common.error"))
          setErrorImei(findImeiInMessage(err?.message))
        },
      }
    )
  }

  return { draft, setField, batch, removeAt, errorMsg, errorImei, results, addDraft, submit, isSubmitting: addDevices.isPending }
}
