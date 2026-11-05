import * as React from "react"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { isImei } from "@/entities/device"
import type { DeviceModelView } from "@/entities/device-model"
import { useLookup, useTeachLink, MIN_LOOKUP_LENGTH, type LookupProduct } from "@/entities/lookup"
import type { IntakeDraftValues } from "./use-intake-batch"

type Form = UseFormReturn<IntakeDraftValues>

export type LookupStatus =
  | { kind: "found"; model: string }
  | { kind: "pick"; brand: string; model: string; color: string | null; storage: string | null }
  | { kind: "notFound" }
  | null

/**
 * Side lookup for intake (ADR 0031): a box code (preferred) or a full IMEI is
 * resolved to a reference and, when known, our product. A named product is
 * auto-selected and its empty storage/colour are filled; an unnamed reference
 * is offered for a one-time pick. Never gates saving.
 */
export function useIntakeLookup(form: Form, models: DeviceModelView[], canUpdate: boolean) {
  const [boxCode, setBoxCode] = React.useState("")
  const imei = useWatch({ control: form.control, name: "imei" }) ?? ""
  const box = boxCode.trim()
  const code = box.length >= MIN_LOOKUP_LENGTH ? box : isImei(imei.trim()) ? imei.trim() : ""
  const debounced = useDebounce(code, 400)
  const { data, isFetching } = useLookup(debounced)
  const teach = useTeachLink()
  const handledRef = React.useRef<string | null>(null)

  const applyProduct = React.useCallback(
    (product: LookupProduct, force: boolean) => {
      const model = models.find((m) => m.id === product.modelId)
      if (!model) return
      const current = form.getValues("modelId")
      if ((force || !current) && current !== product.modelId) {
        form.setValue("modelId", product.modelId)
        form.setValue("kindCode", model.kindCode)
      }
      if (form.getValues("modelId") !== product.modelId) return
      const specs = { ...(form.getValues("specs") ?? {}) } as Record<string, unknown>
      let changed = false
      if (!specs.storage && product.storageOption) {
        specs.storage = product.storageOption
        changed = true
      }
      if (!specs.color && product.colorOption) {
        specs.color = product.colorOption
        changed = true
      }
      if (changed) form.setValue("specs", specs as IntakeDraftValues["specs"])
    },
    [form, models]
  )

  // Auto-fill once per resolved code when the lists name our product.
  React.useEffect(() => {
    if (isFetching || !debounced || handledRef.current === debounced) return
    if (data === undefined) return
    handledRef.current = debounced
    if (data?.product) applyProduct(data.product, false)
  }, [data, isFetching, debounced, applyProduct])

  const status: LookupStatus = React.useMemo(() => {
    if (!debounced || isFetching || data === undefined) return null
    if (data === null) return { kind: "notFound" }
    if (data.product) return { kind: "found", model: `${data.reference.brand} ${data.reference.model}` }
    const r = data.reference
    return { kind: "pick", brand: r.brand, model: r.model, color: r.color, storage: r.storage }
  }, [data, isFetching, debounced])

  const pickProduct = (modelId: string, remember: boolean) => {
    const model = models.find((m) => m.id === modelId)
    if (!model) return
    applyProduct(
      { modelId, brand: model.brand, name: model.name, kindCode: model.kindCode, matchedBy: "manual", storageOption: null, colorOption: null },
      true
    )
    if (remember && canUpdate && data?.reference) {
      teach.mutate({ refBrand: data.reference.brand, refModel: data.reference.model, modelId })
    }
  }

  return { boxCode, setBoxCode, status, pickProduct, canUpdate, remembered: teach.isSuccess }
}
