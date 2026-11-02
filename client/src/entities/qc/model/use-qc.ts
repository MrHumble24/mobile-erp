import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { qcRepository } from "../api/qc.repository"
import { qcKeys } from "../api/qc.keys"
import { deviceKeys } from "@/entities/device"
import type { CreateInspectionDto } from "./qc.types"

export function useQcInspections(deviceId?: string) {
  return useQuery({
    queryKey: qcKeys.inspections(deviceId),
    queryFn: () => qcRepository.list(deviceId),
  })
}

export function useDefectTypes() {
  return useQuery({
    queryKey: qcKeys.defectTypes(),
    queryFn: () => qcRepository.listDefectTypes(),
  })
}

export function useGrades() {
  return useQuery({
    queryKey: qcKeys.grades(),
    queryFn: () => qcRepository.listGrades(),
  })
}

export function useCreateInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInspectionDto) => qcRepository.createInspection(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qcKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.deviceId) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.history(variables.deviceId) })
    },
  })
}
