import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customerRepository } from "../api/customer.repository"
import { customerKeys } from "../api/customer.keys"
import type { CreateCustomerDto, UpdateCustomerDto } from "./customer.types"

export function useCustomers(query?: string) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: () => customerRepository.list(query),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCustomerSales(id: string) {
  return useQuery({
    queryKey: customerKeys.sales(id),
    queryFn: () => customerRepository.getSales(id),
    enabled: Boolean(id),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => customerRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      customerRepository.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) })
    },
  })
}
