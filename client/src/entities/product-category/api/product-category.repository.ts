import { http } from "@/shared/api/http"
import type {
  CreateProductCategoryDto,
  ProductCategoryView,
  UpdateProductCategoryDto,
} from "../model/product-category.types"

export const productCategoryRepository = {
  list: async (): Promise<ProductCategoryView[]> => {
    return http<ProductCategoryView[]>("/product-categories")
  },

  create: async (dto: CreateProductCategoryDto): Promise<ProductCategoryView> => {
    return http<ProductCategoryView>("/product-categories", { method: "POST", body: dto })
  },

  update: async (id: string, dto: UpdateProductCategoryDto): Promise<ProductCategoryView> => {
    return http<ProductCategoryView>(`/product-categories/${id}`, { method: "PATCH", body: dto })
  },
}
