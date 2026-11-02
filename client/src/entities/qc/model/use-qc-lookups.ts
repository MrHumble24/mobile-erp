import { useMutation, useQueryClient } from "@tanstack/react-query"
import { qcRepository } from "../api/qc.repository"
import { qcKeys } from "../api/qc.keys"
import type { CreateLookupDto, UpdateLookupDto } from "./qc.types"

type UpdateArgs = { code: string; dto: UpdateLookupDto }

function useLookupInvalidation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: qcKeys.all })
}

export function useCreateDefectType() {
  const invalidate = useLookupInvalidation()
  return useMutation({
    mutationFn: (dto: CreateLookupDto) => qcRepository.createDefectType(dto),
    onSuccess: invalidate,
  })
}

export function useUpdateDefectType() {
  const invalidate = useLookupInvalidation()
  return useMutation({
    mutationFn: ({ code, dto }: UpdateArgs) => qcRepository.updateDefectType(code, dto),
    onSuccess: invalidate,
  })
}

export function useCreateGrade() {
  const invalidate = useLookupInvalidation()
  return useMutation({
    mutationFn: (dto: CreateLookupDto) => qcRepository.createGrade(dto),
    onSuccess: invalidate,
  })
}

export function useUpdateGrade() {
  const invalidate = useLookupInvalidation()
  return useMutation({
    mutationFn: ({ code, dto }: UpdateArgs) => qcRepository.updateGrade(code, dto),
    onSuccess: invalidate,
  })
}
