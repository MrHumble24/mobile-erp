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
        title={t("settings.sectionOnlinePayments")}
        description={t("settings.sectionOnlinePaymentsDesc")}
      >
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </Section>
    )
  }

  return (
    <Section
      title={t("settings.sectionOnlinePayments")}
      description={t("settings.sectionOnlinePaymentsDesc")}
    >
      <div className="space-y-4">
        {providers && providers.length > 0 ? (
          providers.map((p) => (
            <PaymentProviderCard
              key={p.providerCode}
              config={p}
              disabled={disabled}
            />
          ))
        ) : (
          <div className="p-3 text-center text-xs text-muted-foreground">
            {t("settings.noProvidersFound")}
          </div>
        )}
      </div>
    </Section>
  )
}
