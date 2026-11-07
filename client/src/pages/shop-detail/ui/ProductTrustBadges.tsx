import { ShieldCheck, Smartphone, Truck } from "lucide-react"
import { useI18n } from "@/shared/i18n"

export function ProductTrustBadges() {
  const { t } = useI18n()

  const badges = [
    {
      icon: ShieldCheck,
      title: t("storefront.trustWarrantyTitle"),
      desc: t("storefront.trustWarrantyDesc"),
    },
    {
      icon: Smartphone,
      title: t("storefront.trustImeiTitle"),
      desc: t("storefront.trustImeiDesc"),
    },
    {
      icon: Truck,
      title: t("storefront.trustDeliveryTitle"),
      desc: t("storefront.trustDeliveryDesc"),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-border/80">
      {badges.map((b, i) => {
        const Icon = b.icon
        return (
          <div
            key={i}
            className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-muted/30 border border-border/60"
          >
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-foreground leading-tight">
                {b.title}
              </div>
              <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                {b.desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

