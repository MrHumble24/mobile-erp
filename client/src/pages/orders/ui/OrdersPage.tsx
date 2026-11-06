import * as React from "react"
import { RefreshCw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useStorefrontOrders, type OrderStatusCode, type StorefrontOrderView } from "@/entities/order"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { OrdersTable } from "./OrdersTable"
import { OrderDetailSheet } from "./OrderDetailSheet"

const STATUS_TABS: Array<{ labelKey: string; value: OrderStatusCode | undefined }> = [
  { labelKey: "orders.allStatuses", value: undefined },
  { labelKey: "orders.statusNew", value: "NEW" },
  { labelKey: "orders.statusContacted", value: "CONTACTED" },
  { labelKey: "orders.statusDone", value: "DONE" },
  { labelKey: "orders.statusCancelled", value: "CANCELLED" },
]

export function OrdersPage() {
  const { t } = useI18n()
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatusCode | undefined>(undefined)
  const [selectedOrder, setSelectedOrder] = React.useState<StorefrontOrderView | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const { data: orderPage, isLoading, refetch, isFetching } = useStorefrontOrders({
    status: selectedStatus,
  })

  const orders = orderPage?.items ?? []

  const handleSelectOrder = (order: StorefrontOrderView) => {
    setSelectedOrder(order)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={t("orders.title")}
          description={t("orders.subtitle")}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 h-9 rounded-full self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>{t("common.refresh")}</span>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value
          return (
            <Button
              key={tab.labelKey}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setSelectedStatus(tab.value)}
              className="rounded-full text-xs font-semibold shrink-0"
            >
              {t(tab.labelKey)}
            </Button>
          )
        })}
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="space-y-3 bg-white p-6 rounded-2xl border border-[#e8e8e8]">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <OrdersTable
          orders={orders ?? []}
          onSelectOrder={handleSelectOrder}
        />
      )}

      {/* Detail Sheet */}
      <OrderDetailSheet
        orderId={selectedOrder?.id ?? null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

export default OrdersPage
