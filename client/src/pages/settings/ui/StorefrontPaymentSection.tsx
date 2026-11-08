import { useI18n } from "@/shared/i18n"
import { useOnlinePaymentProviders } from "@/entities/online-payment"
import { Section } from "./Section"
import { Skeleton } from "@/shared/ui/skeleton"
import { PaymentProviderCard } from "./storefront/PaymentProviderCard"

export function StorefrontPaymentSection({
  disabled,
}: {
  disabled: boolean
}) {
  const { t } = useI18n()
  const { data: providers, isLoading } = useOnlinePaymentProviders()

  if (isLoading) {
    return (
      <Section
        title={t("settings.sectionPaymentProviders")}
        description={t("settings.sectionPaymentProvidersDesc")}
      >
        <div className="p-4 space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </Section>
    )
  }

  return (
    <Section
      title={t("settings.sectionPaymentProviders")}
      description={t("settings.sectionPaymentProvidersDesc")}
    >
      <div className="p-4 space-y-4">
        {providers && providers.length > 0 ? (
          providers.map((p) => (
            <PaymentProviderCard
              key={p.providerCode}
              config={p}
              disabled={disabled}
            />
          ))
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {t("settings.noPaymentProviders")}
          </div>
        )}
      </div>
    </Section>
  )
}
