export const storefrontKeys = {
  all: ["storefront"] as const,
  config: () => [...storefrontKeys.all, "config"] as const,
  products: (params?: {
    categoryId?: string
    search?: string
    page?: number
    pageSize?: number
  }) => [...storefrontKeys.all, "products", params] as const,
  product: (modelId: string) =>
    [...storefrontKeys.all, "product", modelId] as const,
  settings: () => [...storefrontKeys.all, "settings"] as const,
  deliveryZones: () => [...storefrontKeys.all, "delivery-zones"] as const,
  publicOrder: (id: string) =>
    [...storefrontKeys.all, "public-order", id] as const,
}
