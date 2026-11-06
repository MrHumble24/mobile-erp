import { useParams, Link } from "react-router"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { usePublicOrder, useStorefrontConfig } from "@/entities/storefront"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { useOrderPaymentStatus } from "../model/use-order-payment-status"
import { OrderStatusCard } from "./OrderStatusCard"
import { OrderAmountBreakdown } from "./OrderAmountBreakdown"
import { OrderPaymentTimeoutAlert } from "./OrderPaymentTimeoutAlert"

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
  const { data: order, isLoading, error, refetch } = usePublicOrder(id)
  const { data: config } = useStorefrontConfig()
  const { paymentState, isPending, handlePayAgain } = useOrderPaymentStatus(order, refetch)

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
          <OrderPaymentTimeoutAlert onPayAgain={handlePayAgain} isPending={isPending} />
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
