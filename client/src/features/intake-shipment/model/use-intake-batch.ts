import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAddShipmentDevices, type RegisterDeviceItem, type RegisteredDeviceView } from "@/entities/shipment"
import type { SpecFieldProblem } from "@/entities/device-model"

export interface IntakeDraftValues {
  imei: string
  imei2: string
  dualSim: boolean
  modelId: string
  specs: Record<string, string>
  cost: number
  targetPrice: number
}

interface ServerProblem {
  imei?: string
  key: string
  message: string
}

type ProblemMap = Record<string, SpecFieldProblem[]>

function findImeiInMessage(message: string | undefined): string | null {
  return message?.match(/\d{15}/)?.[0] ?? null
}

/** Groups a 400 error's `problems` by IMEI; falls back to a duplicate-IMEI hint. */
function mapProblems(err: { message?: string; data?: unknown }): ProblemMap {
  const problems = (err?.data as { problems?: ServerProblem[] })?.problems
  if (problems?.length) {
    const map: ProblemMap = {}
    for (const p of problems) {
      ;(map[p.imei ?? ""] ??= []).push({ key: p.key, message: p.message })
    }
    return map
  }
  const imei = findImeiInMessage(err?.message)
  return imei ? { [imei]: [] } : {}
}

interface SubmitBag {
  t: (key: string) => string
  setResults: (r: RegisteredDeviceView[]) => void
  setBatch: (b: RegisterDeviceItem[]) => void
  setErrorMsg: (m: string) => void
  setProblemsByImei: (p: ProblemMap) => void
}

function submitHandlers(bag: SubmitBag) {
  return {
    onSuccess: (res: RegisteredDeviceView[]) => {
      bag.setResults(res)
      bag.setBatch([])
      bag.setErrorMsg("")
    },
    onError: (err: { message?: string; data?: unknown }) => {
      const map = mapProblems(err)
      const hasSpecProblems = Object.values(map).some((v) => v.length > 0)
      bag.setErrorMsg(hasSpecProblems ? bag.t("shipments.invalidSpecs") : err?.message || bag.t("common.error"))
      bag.setProblemsByImei(map)
    },
  }
}

function draftError(
  values: IntakeDraftValues,
  imei: string,
  imei2: string,
  batch: RegisterDeviceItem[],
  t: (key: string) => string,
): string | null {
  if (!/^\d{15}$/.test(imei)) return t("shipments.imeiLength")
  if (values.dualSim && !imei2) return t("inventory.imei2Required")
  if (imei2 && !/^\d{15}$/.test(imei2)) return t("shipments.imeiLength")
  if (imei2 && imei2 === imei) return t("inventory.imei2Mismatch")
  if (batch.some((b) => b.imei === imei)) return t("shipments.duplicateImei")
  if (!values.modelId) return t("shipments.selectModel")
  return null
}

/** Owns the scan-and-add batch, its validation and the add-devices mutation. */
export function useIntakeBatch(shipmentId: string) {
  const { t } = useI18n()
  const addDevices = useAddShipmentDevices()
  const [batch, setBatch] = React.useState<RegisterDeviceItem[]>([])
  const [errorMsg, setErrorMsg] = React.useState("")
  const [problemsByImei, setProblemsByImei] = React.useState<ProblemMap>({})
  const [results, setResults] = React.useState<RegisteredDeviceView[]>([])

  /** Validates and appends one unit; returns an i18n error (shown in the confirm dialog) or null. */
  const addItem = (values: IntakeDraftValues): string | null => {
    const imei = values.imei.trim()
    const imei2 = values.imei2.trim()
    const error = draftError(values, imei, imei2, batch, t)
    if (error) return error
    setErrorMsg("")
    setBatch((p) => [
      ...p,
      {
        imei,
        imei2: values.dualSim ? imei2 || null : null,
        modelId: values.modelId,
        specs: values.specs,
        acquisitionCost: values.cost,
        targetPrice: values.targetPrice,
      },
    ])
    return null
  }

  const submit = () => {
    if (batch.length === 0) return
    setProblemsByImei({})
    addDevices.mutate(
      { id: shipmentId, dto: { devices: batch } },
      submitHandlers({ t, setResults, setBatch, setErrorMsg, setProblemsByImei }),
    )
  }

  return {
    batch,
    addItem,
    removeAt: (index: number) => setBatch((p) => p.filter((_, i) => i !== index)),
    errorMsg,
    problemsByImei,
    results,
    submit,
    isSubmitting: addDevices.isPending,
  }
}
