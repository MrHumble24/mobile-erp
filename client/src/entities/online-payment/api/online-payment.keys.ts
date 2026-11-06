export const onlinePaymentKeys = {
  all: ["online-payments"] as const,
  providers: () => [...onlinePaymentKeys.all, "providers"] as const,
  provider: (code: string) =>
    [...onlinePaymentKeys.all, "provider", code] as const,
}
