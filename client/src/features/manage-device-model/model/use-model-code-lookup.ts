import * as React from "react"
import type { UseFormReturn } from "react-hook-form"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { isImei } from "@/entities/device"
import {
  useLookup,
  useLookupSearch,
  useTeachLink,
  MIN_LOOKUP_LENGTH,
  MIN_SEARCH_LENGTH,
  type LookupSearchResult,
} from "@/entities/lookup"
import {
  slugKey,
  type DeviceModelFormValues,
  type ModelAttributeValue,
} from "./device-model-form.schema"

export type ModelLookupStatus =
  | { kind: "found"; model: string; details?: string }
  | { kind: "notFound" }
  | null

/** Mirror of the server's `boxCodeKey`: upper-cased first 5 alphanumerics. */
function boxCodeKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5)
}

function setModelAttributes(
  current: ModelAttributeValue[],
  specs: Array<["storage" | "color", string[]]>
): ModelAttributeValue[] {
  const attrs = [...current]
  for (const [key, values] of specs) {
    const idx = attrs.findIndex((a) => a.key === key || slugKey(a.label) === key)
    if (idx === -1) {
      attrs.push({
        key,
        label: key === "storage" ? "Storage" : "Color",
        type: "select",
        options: [...values],
        required: key === "storage",
      })
    } else {
      attrs[idx] = { ...attrs[idx], options: [...values] }
    }
  }
  return attrs
}

/**
 * Code lookup for the new-model drawer (the shipment intake lookup, ADR 0031,
 * reused at model keying). Typing a maker box code (the 5-char Apple base, or a
 * 15-digit IMEI) resolves the reference lists and — once per code — fills the
 * form: brand/name (only when empty), the model code, and the storage/color
 * spec options. A known code that already names one of our products still fills
 * the fields; saving then surfaces the usual duplicate error. An unknown code
 * shows a quiet hint and the form stays fully manual — never gates saving.
 */
export function useModelCodeLookup(form: UseFormReturn<DeviceModelFormValues>) {
  const [boxCode, setBoxCode] = React.useState("")
  const [searchDismissed, setSearchDismissed] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState<{
    brand: string
    model: string
    details?: string
  } | null>(null)

  const trimmed = boxCode.trim()
  const debounced = useDebounce(trimmed, 300)
  const codeToLookup = debounced.length >= MIN_LOOKUP_LENGTH ? debounced : null
  const { data, isFetching: isLookupFetching } = useLookup(codeToLookup)
  const { data: searchData, isFetching: isSearchFetching } = useLookupSearch(
    debounced.length >= MIN_SEARCH_LENGTH ? debounced : ""
  )

  const teach = useTeachLink()
  const handledRef = React.useRef<string | null>(null)

  const handleSetBoxCode = React.useCallback((val: string) => {
    setBoxCode(val)
    setSearchDismissed(false)
    setSelectedModel(null)
  }, [])

  const applySpecs = React.useCallback(
    (specs: Array<["storage" | "color", string[]]>) => {
      const current = form.getValues("attributes") ?? []
      const nextAttrs = setModelAttributes(current, specs)
      form.setValue("attributes", nextAttrs, { shouldDirty: true })
      specs.forEach(([key, values]) => {
        const idx = nextAttrs.findIndex(
          (a) => a.key === key || slugKey(a.label) === key
        )
        if (idx !== -1) {
          form.setValue(`attributes.${idx}.options` as any, values, {
            shouldDirty: true,
          })
        }
      })
    },
    [form]
  )

  React.useEffect(() => {
    if (!debounced) handledRef.current = null
  }, [debounced])

  React.useEffect(() => {
    if (isLookupFetching || !codeToLookup || handledRef.current === codeToLookup) return
    if (data === undefined || data === null) return
    handledRef.current = codeToLookup
    const { reference } = data

    form.setValue("brand", reference.brand, { shouldDirty: true })
    form.setValue("name", reference.model, { shouldDirty: true })
    if (!isImei(codeToLookup)) {
      const codeVal = reference.modelNumber || reference.modelCode || boxCodeKey(codeToLookup)
      form.setValue("modelCode", codeVal, { shouldDirty: true })
    }

    const storages = reference.storageOptions?.length
      ? reference.storageOptions
      : reference.storage
        ? [reference.storage]
        : []
    const colors = reference.colorOptions?.length
      ? reference.colorOptions
      : reference.color
        ? [reference.color]
        : []

    applySpecs([
      ["storage", storages],
      ["color", colors],
    ])
  }, [data, isLookupFetching, codeToLookup, form, applySpecs])

  const selectSearchResult = React.useCallback(
    (item: LookupSearchResult) => {
      form.setValue("brand", item.brand, { shouldDirty: true })
      form.setValue("name", item.model, { shouldDirty: true })
      if (item.modelCode) {
        form.setValue("modelCode", item.modelCode, { shouldDirty: true })
      }
      form.setValue("kindCode", item.kindCode, { shouldDirty: true })
      applySpecs([
        ["storage", item.storageOptions],
        ["color", item.colorOptions],
      ])
      setSelectedModel({
        brand: item.brand,
        model: item.model,
        details: [
          item.colorOptions.length ? `${item.colorOptions.length} colors` : null,
          item.storageOptions.length ? `${item.storageOptions.length} storages` : null,
        ]
          .filter(Boolean)
          .join(", "),
      })
      setSearchDismissed(true)
    },
    [form, applySpecs]
  )

  const status: ModelLookupStatus = React.useMemo(() => {
    if (selectedModel) {
      return {
        kind: "found",
        model: `${selectedModel.brand} ${selectedModel.model}`,
        details: selectedModel.details,
      }
    }
    if (!debounced || isLookupFetching || data === undefined) return null
    if (data === null) {
      return debounced.length >= 5 && (!searchData || searchData.length === 0)
        ? { kind: "notFound" }
        : null
    }
    const r = data.reference
    const counts = [
      r.colorOptions?.length ? `${r.colorOptions.length} colors` : r.color ? "1 color" : null,
      r.storageOptions?.length ? `${r.storageOptions.length} storages` : r.storage ? "1 storage" : null,
    ]
      .filter(Boolean)
      .join(", ")
    return {
      kind: "found",
      model: `${r.brand} ${r.model}`,
      details: counts || undefined,
    }
  }, [selectedModel, debounced, isLookupFetching, data, searchData])

  const rememberLink = React.useCallback(
    (newModelId: string) => {
      if (!data || !data.reference || data.product) return
      teach.mutate({
        refBrand: data.reference.brand,
        refModel: data.reference.model,
        modelId: newModelId,
      })
    },
    [data, teach]
  )

  const searchResults = !searchDismissed ? (searchData ?? []) : []

  return {
    boxCode,
    setBoxCode: handleSetBoxCode,
    status,
    isFetching: isLookupFetching || isSearchFetching,
    searchResults,
    selectSearchResult,
    searchDismissed,
    dismissSearch: () => setSearchDismissed(true),
    rememberLink,
  }
}
