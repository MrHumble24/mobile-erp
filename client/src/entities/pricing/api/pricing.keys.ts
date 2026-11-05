export const pricingKeys = {
  all: ["pricing"] as const,
  levels: () => [...pricingKeys.all, "levels"] as const,
  product: (modelId: string) => [...pricingKeys.all, "product", modelId] as const,
  unit: (deviceId: string) => [...pricingKeys.all, "unit", deviceId] as const,
}
