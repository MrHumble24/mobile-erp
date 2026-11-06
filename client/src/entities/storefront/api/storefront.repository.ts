import { http } from "@/shared/api/http"
import type {
  StorefrontConfig,
  StorefrontProductCard,
  StorefrontProductDetail,
  CreateStorefrontOrderDto,
  StorefrontSettingsView,
  UpdateStorefrontSettingsDto,
  StorefrontDeliveryZoneView,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
  PublicStorefrontOrderView,
} from "./storefront.types"

export const storefrontRepository = {
  getConfig: () =>
    http<StorefrontConfig>("/storefront/config", { public: true }),

  getProducts: (params?: {
    categoryId?: string
    search?: string
    page?: number
    pageSize?: number
  }) =>
    http<StorefrontProductCard[]>("/storefront/products", {
      public: true,
      params,
    }),

  getProduct: (modelId: string) =>
    http<StorefrontProductDetail>(`/storefront/products/${modelId}`, {
      public: true,
    }),

  createOrder: (dto: CreateStorefrontOrderDto) =>
    http<{ id: string }>("/storefront/orders", {
      method: "POST",
      body: dto,
      public: true,
    }),

  getPublicOrder: (id: string) =>
    http<PublicStorefrontOrderView>(`/storefront/orders/${id}`, {
      public: true,
    }),

  payOrder: (id: string, provider?: string) =>
    http<{ checkoutUrl: string }>(`/storefront/orders/${id}/pay`, {
      method: "POST",
      body: { provider },
      public: true,
    }),

  getSettings: () => http<StorefrontSettingsView>("/storefront/settings"),

  updateSettings: (dto: UpdateStorefrontSettingsDto) =>
    http<StorefrontSettingsView>("/storefront/settings", {
      method: "PUT",
      body: dto,
    }),

  listDeliveryZones: () =>
    http<StorefrontDeliveryZoneView[]>("/storefront/delivery-zones"),

  createDeliveryZone: (dto: CreateDeliveryZoneDto) =>
    http<StorefrontDeliveryZoneView>("/storefront/delivery-zones", {
      method: "POST",
      body: dto,
    }),

  updateDeliveryZone: (id: string, dto: UpdateDeliveryZoneDto) =>
    http<StorefrontDeliveryZoneView>(`/storefront/delivery-zones/${id}`, {
      method: "PUT",
      body: dto,
    }),

  deleteDeliveryZone: (id: string) =>
    http<{ deleted: boolean }>(`/storefront/delivery-zones/${id}`, {
      method: "DELETE",
    }),
}
