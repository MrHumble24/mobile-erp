import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customerRepository } from "../api/customer.repository"
import { customerKeys } from "../api/customer.keys"
import type {
  CreateCustomerDto,
  CustomerListFilters,
  UpdateCustomerDto,
} from "./customer.types"

/** POS typeahead: resolves a short list of customers by name/phone. */
export function useCustomers(query?: string) {
  return useQuery({
    queryKey: customerKeys.lookup(query),
    queryFn: () => customerRepository.lookup(query),
  })
}

/** Paginated management list with aggregates. */
export function useCustomerList(filters: CustomerListFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customerRepository.page(filters),
  })
}

export function useCustomerStats() {
  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: () => customerRepository.stats(),
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
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      customerRepository.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
