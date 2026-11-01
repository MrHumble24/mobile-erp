import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supplierRepository } from "../api/supplier.repository"
import { supplierKeys } from "../api/supplier.keys"
import type { CreateSupplierDto, UpdateSupplierDto } from "./supplier.types"

export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.lists(),
    queryFn: () => supplierRepository.list(),
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateSupplierDto) => supplierRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSupplierDto }) =>
      supplierRepository.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) })
    },
  })
}
