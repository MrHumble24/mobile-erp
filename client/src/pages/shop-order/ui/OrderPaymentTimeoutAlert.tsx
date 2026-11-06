import { AlertCircle, RefreshCw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"

export function OrderPaymentTimeoutAlert({
  onPayAgain,
  isPending,
}: {
  onPayAgain: () => void
  isPending: boolean
}) {
  const { t } = useI18n()

  return (
    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            {t("storefront.paymentNotReceivedTitle")}
          </p>
          <p className="text-muted-foreground">{t("storefront.paymentNotReceivedDesc")}</p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onPayAgain}
        disabled={isPending}
        className="w-full text-xs font-semibold gap-1.5"
      >
        <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
        <span>{t("storefront.payAgain")}</span>
      </Button>
    </div>
  )
}
