import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ledgerRepository } from "../api/ledger.repository"
import { ledgerKeys } from "../api/ledger.keys"
import type {
  CreateLedgerEntryDto,
  LedgerFilters,
  LedgerTransferDto,
} from "./ledger.types"

export function useLedgerBalances() {
  return useQuery({
    queryKey: ledgerKeys.balances(),
    queryFn: () => ledgerRepository.balances(),
  })
}

export function useLedgerTransactions(filters?: LedgerFilters) {
  return useQuery({
    queryKey: ledgerKeys.transactionList(filters),
    queryFn: () => ledgerRepository.list(filters),
  })
}

function useLedgerWriteOptions() {
  const queryClient = useQueryClient()
  return {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ledgerKeys.balances() })
      queryClient.invalidateQueries({ queryKey: ledgerKeys.transactions() })
    },
  }
}

export function useCreateLedgerEntry() {
  const opts = useLedgerWriteOptions()
  return useMutation({
    mutationFn: (dto: CreateLedgerEntryDto) => ledgerRepository.createEntry(dto),
    ...opts,
  })
}

export function useLedgerTransfer() {
  const opts = useLedgerWriteOptions()
  return useMutation({
    mutationFn: (dto: LedgerTransferDto) => ledgerRepository.transfer(dto),
    ...opts,
  })
}
