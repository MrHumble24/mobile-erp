import * as React from "react"
import { codeToIdentifier, useDeviceByImei } from "@/entities/device"
import type { DeviceRow } from "./use-consign-form"

/** Wait for typing to settle before hitting the inventory lookup. */
export const LOOKUP_DEBOUNCE_MS = 350

/**
 * The inventory side of a consign row: fetches the unit behind the typed or
 * scanned code the same way every other module resolves one (GET
 * /devices/by-imei, ADR 0029), so the row knows its device before submitting
 * instead of the server 404-ing blindly. Also defaults the agreed price to the
 * unit's PARTNER list price while the field is still empty (ADR 0034) — the
 * server does the same when no explicit price arrives, but the form needs a
 * value in the input to allow submission.
 */
export function useConsignDeviceLookup(
  row: DeviceRow,
  patchRow: (patch: Partial<DeviceRow>) => void,
) {
  const code = row.imei.trim()
  const [debouncedCode, setDebouncedCode] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedCode(code.length >= 3 ? code : ""),
      LOOKUP_DEBOUNCE_MS
    )
    return () => clearTimeout(timer)
  }, [code])

  const identifier = debouncedCode ? codeToIdentifier(debouncedCode) : null
  const queryCode = identifier
    ? "imei" in identifier
      ? identifier.imei
      : identifier.serialNumber
    : null
  const { data: device, isFetching } = useDeviceByImei(queryCode)

  const partnerPrice = device?.prices?.PARTNER ?? null
  const prefilledFor = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!device || !partnerPrice) return
    if (prefilledFor.current === device.id) return
    prefilledFor.current = device.id
    if (!row.agreedPrice.trim()) patchRow({ agreedPrice: partnerPrice })
  }, [device, partnerPrice, row.agreedPrice, patchRow])

  return { device, isFetching, resolvedCode: debouncedCode }
}
