import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { isNetworkError } from "@/shared/api/http"
import { enqueueMutation, MUTATION_TYPES, type MutationType } from "@/entities/sync"
import { customerKeys } from "@/entities/customer"
import { ledgerKeys } from "@/entities/ledger"
import { stockKeys } from "@/entities/stock"
import { repairRepository } from "../api/repair.repository"
import { repairKeys } from "../api/repair.keys"
import { RepairQueuedError } from "../lib/repair-error"
import type {
  AddPartDto,
  ChangeStatusDto,
  CreateRepairDto,
  RepairMoneyDto,
  RepairView,
  UpdateRepairDto,
} from "./repair.types"

/** A ticket change touches the repair itself and the customer summary. */
function invalidateTicket(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: repairKeys.all })
  qc.invalidateQueries({ queryKey: customerKeys.all })
}

/** Money paths also move the ledger balance. */
function invalidateMoney(qc: QueryClient) {
  invalidateTicket(qc)
  qc.invalidateQueries({ queryKey: ledgerKeys.all })
}

/** Every repair write carries an idempotency key. On a transport failure it is
 *  queued for replay instead of being lost; the caller sees RepairQueuedError. */
async function runRepairWrite<T extends object>(
  type: MutationType,
  repairId: string | undefined,
  dto: T,
  send: (body: T & { clientMutationId: string }) => Promise<RepairView>
): Promise<RepairView> {
  const id = (dto as { clientMutationId?: string }).clientMutationId ?? crypto.randomUUID()
  const body = { ...dto, clientMutationId: id }
  try {
    return await send(body)
  } catch (err) {
    if (!isNetworkError(err)) throw err
    await enqueueMutation({
      id,
      type,
      payload: { ...body, ...(repairId ? { repairId } : {}) } as unknown as Record<string, unknown>,
    })
    throw new RepairQueuedError()
  }
}

/** Create a new repair ticket (`repair.manage`). */
export function useCreateRepair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRepairDto) =>
      runRepairWrite(MUTATION_TYPES.repairCreate, undefined, dto, (body) => repairRepository.create(body)),
    onSuccess: () => invalidateTicket(qc),
  })
}

/** Edit ticket details while not terminal (`repair.manage`). */
export function useUpdateRepair(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateRepairDto) =>
      runRepairWrite(MUTATION_TYPES.repairUpdate, id, dto, (body) => repairRepository.update(id, body)),
    onSuccess: () => invalidateTicket(qc),
  })
}

/** Move the ticket to a new status (`repair.manage`). */
export function useChangeRepairStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ChangeStatusDto) =>
      runRepairWrite(MUTATION_TYPES.repairStatus, id, dto, (body) => repairRepository.changeStatus(id, body)),
    onSuccess: () => invalidateTicket(qc),
  })
}

/** Take a quantity part out of stock for the ticket (`repair.manage`). */
export function useAddRepairPart(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: AddPartDto) =>
      runRepairWrite(MUTATION_TYPES.repairPartAdd, id, dto, (body) => repairRepository.addPart(id, body)),
    onSuccess: () => {
      invalidateTicket(qc)
      qc.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}

/** Return a part to stock (`repair.manage`). Removed parts are idempotent by
 *  nature, but offline removal is still queued so it is not silently lost. */
export function useRemoveRepairPart(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (partId: string) => {
      try {
        return await repairRepository.removePart(id, partId)
      } catch (err) {
        if (!isNetworkError(err)) throw err
        await enqueueMutation({
          id: crypto.randomUUID(),
          type: MUTATION_TYPES.repairPartRemove,
          payload: { repairId: id, partId },
        })
        throw new RepairQueuedError()
      }
    },
    onSuccess: () => {
      invalidateTicket(qc)
      qc.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}

/** Take a customer payment (`repair.payment`); server caps at amount owed. */
export function useAddRepairPayment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RepairMoneyDto) =>
      runRepairWrite(MUTATION_TYPES.repairPayment, id, dto, (body) => repairRepository.addPayment(id, body)),
    onSuccess: () => invalidateMoney(qc),
  })
}

/** Refund money taken (`repair.payment`); server caps at net paid. */
export function useRefundRepair(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RepairMoneyDto) =>
      runRepairWrite(MUTATION_TYPES.repairRefund, id, dto, (body) => repairRepository.refund(id, body)),
    onSuccess: () => invalidateMoney(qc),
  })
}

/** Pay the outside master (`repair.payment`); outside-master tickets only. */
export function useOutsideRepairPayment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RepairMoneyDto) =>
      runRepairWrite(MUTATION_TYPES.repairOutside, id, dto, (body) => repairRepository.outsidePayment(id, body)),
    onSuccess: () => invalidateMoney(qc),
  })
}
