import type { StorefrontProductCard } from "@/entities/storefront"

export type SortOption = "featured" | "price_asc" | "price_desc" | "stock_desc"

/** Distinct brand names present in the product list, sorted alphabetically. */
export function extractBrands(products: StorefrontProductCard[]): string[] {
  const brands = new Set<string>()
  products.forEach((p) => {
    if (p.brand) brands.add(p.brand)
  })
  return Array.from(brands).sort()
}

/** Client-side brand/store filter + sort for instant catalog responsiveness. */
export function filterAndSortProducts(
  products: StorefrontProductCard[],
  opts: { brand: string; store: string; sort: SortOption }
): StorefrontProductCard[] {
  let list = [...products]

  if (opts.brand !== "ALL") {
    list = list.filter((p) => p.brand.toLowerCase() === opts.brand.toLowerCase())
  }

  if (opts.store !== "ALL") {
    list = list.filter((p) => p.stores.some((st) => st.id === opts.store))
  }

  switch (opts.sort) {
    case "price_asc":
      list.sort((a, b) => Number(a.priceFrom ?? 0) - Number(b.priceFrom ?? 0))
      break
    case "price_desc":
      list.sort((a, b) => Number(b.priceFrom ?? 0) - Number(a.priceFrom ?? 0))
      break
    case "stock_desc":
      list.sort((a, b) => b.inStock - a.inStock)
      break
    case "featured":
    default:
      // Prioritize in-stock and flagship brands
      list.sort((a, b) => {
        if (b.inStock > 0 && a.inStock === 0) return 1
        if (a.inStock > 0 && b.inStock === 0) return -1
        return a.name.localeCompare(b.name)
      })
      break
  }

  return list
}

/** Flagship hero pick: a current-gen model if present, else the first product. */
export function pickSpotlight(products: StorefrontProductCard[]): StorefrontProductCard | null {
  if (products.length === 0) return null
  return (
    products.find((p) => p.name.includes("18") || p.name.includes("17") || p.name.includes("S25")) ??
    products[0]
  )
}
