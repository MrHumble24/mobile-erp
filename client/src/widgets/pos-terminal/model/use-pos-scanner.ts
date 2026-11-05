import * as React from "react"
import type { DeviceDetailView } from "@/entities/device"
import type { StockScanProduct } from "@/entities/stock"
import { useScan } from "@/features/scan-code"

/** The inline info card cases: a unit that is not sellable, or an unknown code. */
export interface ScanResult {
  kind: "status" | "notFound"
  imei: string
  device?: DeviceDetailView
}

/** Shortest accepted code: a serial number's minimum length (ADR 0029). */
const MIN_CODE_LENGTH = 3

/** DOM id on the scanner input, so F2 can focus it without threading a ref through the tree. */
export const SCANNER_INPUT_ID = "pos-scanner-input"

export function focusScanner() {
  document.getElementById(SCANNER_INPUT_ID)?.focus()
}

interface Lookup {
  code: string
  /** Bumped on every scan so re-scanning the same code re-runs the dispatch. */
  nonce: number
}

/**
 * Drives the barcode field through GET /scan/:code (ADR 0030). An IN_STOCK unit
 * is dispatched to `onInStock`; a quantity product to `onProduct`; any other
 * unit status (or an unknown code) is surfaced as `scanResult` for an info card.
 * All React state changes happen in event handlers; the effect only forwards
 * resolved data to the external handlers.
 */
export function usePosScanner(
  onInStock: (device: DeviceDetailView) => void,
  onProduct: (product: StockScanProduct) => void
) {
  const [imei, setImei] = React.useState("")
  const [lookup, setLookup] = React.useState<Lookup | null>(null)
  const { data, isFetching } = useScan(lookup?.code ?? null, lookup?.nonce)
  const handledRef = React.useRef<Lookup | null>(null)
  const onInStockRef = React.useRef(onInStock)
  const onProductRef = React.useRef(onProduct)

  React.useEffect(() => {
    onInStockRef.current = onInStock
    onProductRef.current = onProduct
  })

  React.useEffect(() => {
    if (!lookup || isFetching || handledRef.current === lookup || !data) return
    handledRef.current = lookup
    if (data.kind === "unit" && data.unit.statusCode === "IN_STOCK") {
      onInStockRef.current(data.unit)
    } else if (data.kind === "product") {
      onProductRef.current(data.product)
    }
  }, [lookup, data, isFetching])

  const submit = (code: string) => {
    const trimmed = code.trim()
    if (trimmed.length < MIN_CODE_LENGTH) return false
    setImei("")
    setLookup({ code: trimmed, nonce: Date.now() })
    return true
  }

  const clear = () => {
    setImei("")
    setLookup(null)
    handledRef.current = null
  }

  const scanResult: ScanResult | null = React.useMemo(() => {
    if (!lookup || isFetching || !data) return null
    if (data.kind === "notFound") return { kind: "notFound", imei: lookup.code }
    if (data.kind === "unit" && data.unit.statusCode !== "IN_STOCK") {
      return { kind: "status", imei: lookup.code, device: data.unit }
    }
    return null
  }, [lookup, data, isFetching])

  return { imei, setImei, submit, clear, scanResult, isFetching }
}

export type PosScannerApi = ReturnType<typeof usePosScanner>
