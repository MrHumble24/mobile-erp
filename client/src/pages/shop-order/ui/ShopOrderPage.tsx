import { useParams, Link } from "react-router"
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { usePublicOrder, useStorefrontConfig } from "@/entities/storefront"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { useOrderPaymentStatus } from "../model/use-order-payment-status"
import { OrderStatusCard } from "./OrderStatusCard"
import { OrderAmountBreakdown } from "./OrderAmountBreakdown"

function OrderNotFoundView() {
  const { t } = useI18n()
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
        <AlertCircle className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="font-bold text-lg">{t("storefront.orderNotFound")}</h2>
        <p className="text-xs text-muted-foreground">{t("storefront.orderNotFoundDesc")}</p>
      </div>
      <Button variant="outline" size="sm" render={<Link to="/shop" />} className="rounded-full">
        <ArrowLeft className="size-3.5 mr-1.5" />
        <span>{t("storefront.backToCatalog")}</span>
      </Button>
    </div>
  )
}

export function ShopOrderPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, error } = usePublicOrder(id)
  const { data: config } = useStorefrontConfig()
  const { paymentState, isPending, handlePayAgain } = useOrderPaymentStatus(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 max-w-xl mx-auto space-y-4 pt-10">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <OrderNotFoundView />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="h-14 border-b border-border bg-card px-4 flex items-center">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          <Link to="/shop" className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            <span>{config?.shopName || t("storefront.catalog")}</span>
          </Link>
          <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-4">
        <OrderStatusCard order={order} paymentState={paymentState} />

        {paymentState === "TIMEOUT" && (
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
            <Button size="sm" onClick={handlePayAgain} disabled={isPending} className="w-full text-xs font-semibold gap-1.5">
              <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>{t("storefront.payAgain")}</span>
            </Button>
          </div>
        )}

        <OrderAmountBreakdown order={order} />

        <div className="pt-2 text-center">
          <Button variant="ghost" size="sm" render={<Link to="/shop" />} className="text-xs text-muted-foreground">
            {t("storefront.continueShopping")}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default ShopOrderPage
