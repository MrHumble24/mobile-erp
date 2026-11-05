import { http } from "@/shared/api/http"
import type {
  PriceLevel,
  ProductPricesView,
  PutProductPricesDto,
  PutUnitPricesDto,
  UnitPricesView,
} from "../model/pricing.types"

export const pricingRepository = {
  levels: () => http<PriceLevel[]>("/pricing/levels"),

  productPrices: (modelId: string) =>
    http<ProductPricesView>(`/pricing/products/${modelId}`),

  setProductPrices: (modelId: string, dto: PutProductPricesDto) =>
    http<ProductPricesView>(`/pricing/products/${modelId}`, { method: "PUT", body: dto }),

  unitPrices: (deviceId: string) => http<UnitPricesView>(`/pricing/units/${deviceId}`),

  setUnitPrices: (deviceId: string, dto: PutUnitPricesDto) =>
    http<UnitPricesView>(`/pricing/units/${deviceId}`, { method: "PUT", body: dto }),
}
