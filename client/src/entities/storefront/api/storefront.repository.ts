import { http } from "@/shared/api/http"
import type {
  StorefrontConfig,
  StorefrontProductCard,
  StorefrontProductDetail,
  CreateStorefrontOrderDto,
  StorefrontSettingsView,
  UpdateStorefrontSettingsDto,
} from "./storefront.types"

export const storefrontRepository = {
  getConfig: () =>
    http<StorefrontConfig>("/storefront/config", { public: true }),

  getProducts: (params?: { categoryId?: string; search?: string; page?: number; pageSize?: number }) =>
    http<StorefrontProductCard[]>("/storefront/products", { public: true, params }),

  getProduct: (modelId: string) =>
    http<StorefrontProductDetail>(`/storefront/products/${modelId}`, { public: true }),

  createOrder: (dto: CreateStorefrontOrderDto) =>
    http<{ id: string }>("/storefront/orders", { method: "POST", body: dto, public: true }),

  getSettings: () =>
    http<StorefrontSettingsView>("/storefront/settings"),

  updateSettings: (dto: UpdateStorefrontSettingsDto) =>
    http<StorefrontSettingsView>("/storefront/settings", { method: "PUT", body: dto }),
}
