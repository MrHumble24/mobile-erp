import { MapPin, Clock, Phone } from "lucide-react"
import { useI18n } from "@/shared/i18n"

interface ShopTrustSectionProps {
  contactPhone?: string | null
  contactTelegram?: string | null
  telegramUrl: string
}

export function ShopTrustSection({
  contactPhone,
  contactTelegram,
  telegramUrl,
}: ShopTrustSectionProps) {
  const { t } = useI18n()

  return (
    <section className="mt-16 rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-xs)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Location */}
        <div className="flex items-start gap-3.5">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-sm font-bold text-foreground">
              {t("storefront.storeLocationTitle")}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("storefront.storeLocationDesc")}
            </p>
          </div>
        </div>

        {/* Working Hours */}
        <div className="flex items-start gap-3.5">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-sm font-bold text-foreground">
              {t("storefront.openHours")}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dam olish kunlarisiz, soat 09:00 dan 20:00 gacha xizmatingizdamiz.
            </p>
          </div>
        </div>

        {/* Fast Contact */}
        <div className="flex items-start gap-3.5">
          <div className="size-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Phone className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-sm font-bold text-foreground">
              {t("storefront.contactPhone")}
            </h4>
            <p className="text-xs text-muted-foreground font-mono">
              {contactPhone || "+998 90 999 88 77"}
            </p>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline inline-block mt-0.5"
            >
              Telegram: {contactTelegram || "@tmobile_malika"}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
