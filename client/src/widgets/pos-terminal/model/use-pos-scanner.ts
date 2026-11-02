import * as React from "react"
import { useDeviceByImei, type DeviceDetailView } from "@/entities/device"

export interface ScanResult {
  kind: "status" | "notFound"
  imei: string
  device?: DeviceDetailView
}

const IMEI_LENGTH = 15

/** DOM id on the scanner input, so F2 can focus it without threading a ref through the tree. */
export const SCANNER_INPUT_ID = "pos-scanner-input"

export function focusScanner() {
  document.getElementById(SCANNER_INPUT_ID)?.focus()
}

interface Lookup {
  imei: string
  /** Bumped on every scan so re-scanning the same IMEI re-runs the dispatch (and its duplicate toast). */
  nonce: number
}

/**
 * Drives the barcode scanner through the device-by-IMEI query. An IN_STOCK hit is
 * dispatched to `onInStock`; any other status (or a 404) is surfaced as `scanResult`
 * for an inline info card. All React state changes happen in event handlers, never
 * in an effect — the effect only forwards resolved data to the external handler.
 */
export function usePosScanner(onInStock: (device: DeviceDetailView) => void) {
  const [imei, setImei] = React.useState("")
  const [lookup, setLookup] = React.useState<Lookup | null>(null)
  const { data, isFetching, isError } = useDeviceByImei(lookup?.imei ?? null)
  const handledRef = React.useRef<Lookup | null>(null)
  const onInStockRef = React.useRef(onInStock)

  React.useEffect(() => {
    onInStockRef.current = onInStock
  })

  React.useEffect(() => {
    if (!lookup || isFetching || handledRef.current === lookup) return
    if (isError) {
      handledRef.current = lookup
      return
    }
    if (data && data.imei === lookup.imei) {
      handledRef.current = lookup
      if (data.statusCode === "IN_STOCK") onInStockRef.current(data)
    }
  }, [lookup, data, isFetching, isError])

  const submit = (code: string) => {
    const trimmed = code.trim()
    if (trimmed.length !== IMEI_LENGTH) return false
    setImei("")
    setLookup({ imei: trimmed, nonce: Date.now() })
    return true
  }

  const clear = () => {
    setImei("")
    setLookup(null)
    handledRef.current = null
  }

  const scanResult: ScanResult | null = React.useMemo(() => {
    if (!lookup || isFetching) return null
    if (isError) return { kind: "notFound", imei: lookup.imei }
    if (data && data.imei === lookup.imei && data.statusCode !== "IN_STOCK") {
      return { kind: "status", imei: lookup.imei, device: data }
    }
    return null
  }, [lookup, data, isFetching, isError])

  return { imei, setImei, submit, clear, scanResult, isFetching }
}

export type PosScannerApi = ReturnType<typeof usePosScanner>
