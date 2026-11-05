import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { productCategoryRepository } from "../api/product-category.repository"
import { productCategoryKeys } from "../api/product-category.keys"
import type {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from "./product-category.types"

export function useProductCategories() {
  return useQuery({
    queryKey: productCategoryKeys.lists(),
    queryFn: () => productCategoryRepository.list(),
  })
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductCategoryDto) => productCategoryRepository.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() }),
  })
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductCategoryDto }) =>
      productCategoryRepository.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() }),
  })
}
