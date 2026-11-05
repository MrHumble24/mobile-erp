import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { shiftKeys } from "../api/shift.keys"
import { isNoOpenShiftError } from "../lib/no-open-shift"

/**
 * Handles the server's `NO_OPEN_SHIFT` 409 on a sale/credit (the shift was
 * closed elsewhere): refreshes the current-shift query so the till flips to the
 * "open a shift" prompt, and tells the cashier. Returns true when it handled the
 * error, so the caller can skip its generic message. The cart is never touched.
 */
export function useShiftGate() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  return React.useCallback(
    (err: unknown): boolean => {
      if (!isNoOpenShiftError(err)) return false
      queryClient.invalidateQueries({ queryKey: shiftKeys.current() })
      toast.error(t("shifts.shiftRequired"))
      return true
    },
    [queryClient, t]
  )
}
