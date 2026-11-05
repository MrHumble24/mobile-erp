import * as React from "react"
import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { isImei, isSerial, normalizeSerial } from "@/entities/device"
import type { IntakeDraftValues } from "./use-intake-batch"

type Slot = "imei" | "imei2" | "serialNumber"
export type SlotErrors = Partial<Record<Slot, string>>

/**
 * Scan-and-stage flow for one intake unit. A scan only FILLS a slot and checks
 * length; it never runs full validation, so scanning IMEI 1 can't raise "IMEI 2
 * required". Once every required slot plus model + cost are set, the confirm
 * dialog opens; a missing model/cost focuses that field instead of erroring.
 * Full validation (duplicate, mismatch) stays in `addItem`/`draftError`.
 */
export function useScanIntake(
  form: UseFormReturn<IntakeDraftValues>,
  onAdd: (values: IntakeDraftValues) => string | null,
) {
  const { t } = useI18n()
  const [slotErrors, setSlotErrors] = React.useState<SlotErrors>({})
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmError, setConfirmError] = React.useState<string | null>(null)
  const imei1Ref = React.useRef<HTMLInputElement>(null)
  const imei2Ref = React.useRef<HTMLInputElement>(null)
  const serialRef = React.useRef<HTMLInputElement>(null)
  const modelRef = React.useRef<HTMLDivElement>(null)
  const costRef = React.useRef<HTMLInputElement>(null)

  /** Model + cost gate shared by both identifier kinds. */
  const stageModelCost = (v: IntakeDraftValues) => {
    if (!v.modelId) return modelRef.current?.querySelector("button")?.focus()
    if (!(Number(v.cost) > 0)) return costRef.current?.focus()
    setConfirmError(null)
    setConfirmOpen(true)
  }

  const stage = () => {
    const v = form.getValues()
    if (v.kindCode === "SERIAL") {
      const serial = normalizeSerial(v.serialNumber)
      if (!isSerial(serial)) return setSlotErrors({ serialNumber: t("catalog.errorSerialInvalid") })
      setSlotErrors({})
      return stageModelCost(v)
    }
    const imei = v.imei.trim()
    if (!isImei(imei)) return setSlotErrors({ imei: t("shipments.imeiLength") })
    if (v.dualSim) {
      const second = v.imei2.trim()
      if (!second) {
        setSlotErrors({})
        imei2Ref.current?.focus()
        return
      }
      if (!isImei(second)) return setSlotErrors({ imei2: t("shipments.imeiLength") })
      if (second === imei) return setSlotErrors({ imei2: t("inventory.imei2Mismatch") })
    }
    setSlotErrors({})
    stageModelCost(v)
  }

  const onScanSlot = (slot: Slot, code: string) => {
    if (confirmOpen) return
    form.setValue(slot, code.trim())
    stage()
  }

  const confirm = () => {
    const error = onAdd(form.getValues())
    if (error) return setConfirmError(error)
    form.setValue("imei", "")
    form.setValue("imei2", "")
    form.setValue("serialNumber", "")
    setSlotErrors({})
    setConfirmError(null)
    setConfirmOpen(false)
    const isSerialKind = form.getValues("kindCode") === "SERIAL"
    ;(isSerialKind ? serialRef : imei1Ref).current?.focus()
  }

  const cancelConfirm = () => {
    setConfirmOpen(false)
    setConfirmError(null)
  }

  return {
    slotErrors,
    confirmOpen,
    confirmError,
    stage,
    onScanSlot,
    confirm,
    cancelConfirm,
    imei1Ref,
    imei2Ref,
    serialRef,
    modelRef,
    costRef,
  }
}
