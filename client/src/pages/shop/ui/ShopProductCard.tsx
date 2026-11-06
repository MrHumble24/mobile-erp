import { MapPin } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { AssetImage } from "@/shared/ui/asset-image"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"
import type { StorefrontProductCard as ProductCardType } from "@/entities/storefront"

export function ShopProductCard({
  product,
  showPrices,
}: {
  product: ProductCardType
  showPrices?: boolean
}) {
  const { t } = useI18n()
  const priceDisplay =
    showPrices && product.priceFrom
      ? `${t("storefront.fromPrice")} ${formatMoney(product.priceFrom)}`
      : t("storefront.ask")

  return (
    <Link
      to={`/shop/${product.modelId}`}
      className="group flex flex-col bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden hover:border-[#b3b3b3] transition-all hover:shadow-md no-underline text-foreground"
    >
      <div className="aspect-square w-full bg-[#f8f9fa] relative overflow-hidden flex items-center justify-center p-4">
        <AssetImage
          path={product.imageUrl}
          alt={product.name}
          className="size-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 right-2.5">
          <Badge variant="emerald" size="sm">
            {product.inStock} {t("storefront.unitsCount")}
          </Badge>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            {product.brand}
          </span>
          <h3 className="font-display font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
          <div className="font-display font-bold text-lg text-foreground whitespace-nowrap tabular-nums">
            {priceDisplay}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {product.stores.map((st) => (
              <span
                key={st.id}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#f4f4f5] text-[#52525b]"
              >
                <MapPin className="size-3 text-[#71717a]" />
                {st.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
