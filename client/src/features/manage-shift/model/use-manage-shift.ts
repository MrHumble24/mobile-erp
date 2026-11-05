import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  shiftRepository,
  shiftKeys,
  type CloseShiftDto,
  type ForceCloseShiftDto,
  type OpenShiftDto,
} from "@/entities/shift"
import { ledgerKeys } from "@/entities/ledger"

/** A close posts a SHIFT_DIFFERENCE row to the ledger when counts differ; opening posts nothing. */
function invalidate(queryClient: QueryClient, touchesLedger: boolean) {
  queryClient.invalidateQueries({ queryKey: shiftKeys.all })
  if (touchesLedger) queryClient.invalidateQueries({ queryKey: ledgerKeys.all })
}

/** Open my shift with the cash counted in the drawer (`sale.create`). */
export function useOpenShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: OpenShiftDto) => shiftRepository.open(dto),
    onSuccess: () => invalidate(queryClient, false),
  })
}

/** Close my shift; the server reconciles the counted cash to the balance (`sale.create`). */
export function useCloseShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CloseShiftDto) => shiftRepository.close(dto),
    onSuccess: () => invalidate(queryClient, true),
  })
}

/** Close another cashier's forgotten shift; note required (`shift.manage`). */
export function useForceCloseShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ForceCloseShiftDto }) =>
      shiftRepository.forceClose(id, dto),
    onSuccess: () => invalidate(queryClient, true),
  })
}
