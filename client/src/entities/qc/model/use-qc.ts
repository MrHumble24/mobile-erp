import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deviceKeys } from "@/entities/device"
import { qcRepository } from "../api/qc.repository"
import { qcKeys } from "../api/qc.keys"
import type { CreateInspectionDto, InspectionFilters, StatsRange } from "./qc.types"

export function useInspections(filters?: InspectionFilters) {
  return useQuery({
    queryKey: qcKeys.inspectionList(filters),
    queryFn: () => qcRepository.listInspections(filters),
  })
}

export function useQcStats(range?: StatsRange) {
  return useQuery({
    queryKey: qcKeys.stats(range),
    queryFn: () => qcRepository.stats(range),
  })
}

export function useDefectTypes(includeInactive?: boolean) {
  return useQuery({
    queryKey: qcKeys.defectTypes(includeInactive),
    queryFn: () => qcRepository.listDefectTypes(includeInactive),
  })
}

export function useGrades(includeInactive?: boolean) {
  return useQuery({
    queryKey: qcKeys.grades(includeInactive),
    queryFn: () => qcRepository.listGrades(includeInactive),
  })
}

export function useCreateInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInspectionDto) => qcRepository.createInspection(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qcKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byImeis() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.deviceId) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.history(variables.deviceId) })
    },
  })
}
