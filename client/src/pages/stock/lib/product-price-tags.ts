import type { StockLevelView } from "@/entities/stock"
import type { PriceTagItem } from "@/features/print-price-tags"

/** Map the quantity-product rows now on screen into shelf labels. */
export function productsToPriceTags(products: StockLevelView[]): PriceTagItem[] {
  return products.map((product) => ({
    id: product.modelId,
    title: product.name,
    subtitle: null,
    price: product.salePrice,
    code: product.barcode ?? null,
    preselected: product.quantity > 0,
  }))
}
