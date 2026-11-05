import { useQuery } from "@tanstack/react-query"
import { scanCode } from "../api/scan.repository"

/** Shortest accepted code: a serial number's minimum length (ADR 0029). */
const MIN_CODE_LENGTH = 3

/**
 * Resolves a scanned/typed code to a unit, a quantity product, or not-found.
 * `nonce` lets the caller force a re-run when the same code is scanned twice.
 */
export function useScan(code: string | null, nonce?: number) {
  const trimmed = code?.trim() ?? ""
  return useQuery({
    queryKey: ["scan", trimmed, nonce],
    queryFn: () => scanCode(trimmed),
    enabled: trimmed.length >= MIN_CODE_LENGTH,
    // A unit's status changes under us (sold, consigned); never act on a stale lookup.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
