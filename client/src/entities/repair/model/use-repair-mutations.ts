import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { customerKeys } from "@/entities/customer"
import { ledgerKeys } from "@/entities/ledger"
import { stockKeys } from "@/entities/stock"
import { repairRepository } from "../api/repair.repository"
import { repairKeys } from "../api/repair.keys"
import type {
  AddPartDto,
  ChangeStatusDto,
  CreateRepairDto,
  RepairMoneyDto,
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

/** Create a new repair ticket (`repair.manage`). */
export function useCreateRepair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRepairDto) => repairRepository.create(dto),
    onSuccess: () => invalidateTicket(qc),
  })
}

/** Edit ticket details while not terminal (`repair.manage`). */
export function useUpdateRepair(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateRepairDto) => repairRepository.update(id, dto),
    onSuccess: () => invalidateTicket(qc),
  })
}

/** Move the ticket to a new status (`repair.manage`). */
export function useChangeRepairStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ChangeStatusDto) => repairRepository.changeStatus(id, dto),
    onSuccess: () => invalidateTicket(qc),
  })
}

/** Take a quantity part out of stock for the ticket (`repair.manage`). */
export function useAddRepairPart(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: AddPartDto) => repairRepository.addPart(id, dto),
    onSuccess: () => {
      invalidateTicket(qc)
      qc.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}

/** Return a part to stock (`repair.manage`). */
export function useRemoveRepairPart(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (partId: string) => repairRepository.removePart(id, partId),
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
    mutationFn: (dto: RepairMoneyDto) => repairRepository.addPayment(id, dto),
    onSuccess: () => invalidateMoney(qc),
  })
}

/** Refund money taken (`repair.payment`); server caps at net paid. */
export function useRefundRepair(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RepairMoneyDto) => repairRepository.refund(id, dto),
    onSuccess: () => invalidateMoney(qc),
  })
}

/** Pay the outside master (`repair.payment`); outside-master tickets only. */
export function useOutsideRepairPayment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RepairMoneyDto) => repairRepository.outsidePayment(id, dto),
    onSuccess: () => invalidateMoney(qc),
  })
}
