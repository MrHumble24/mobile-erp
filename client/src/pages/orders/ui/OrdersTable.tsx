import { Phone, ExternalLink } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import { OrderStatusBadge, type StorefrontOrderView } from "@/entities/order"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"

export function OrdersTable({
  orders,
  onSelectOrder,
}: {
  orders: StorefrontOrderView[]
  onSelectOrder: (order: StorefrontOrderView) => void
}) {
  const { t } = useI18n()

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-border">
        <p className="text-sm font-medium">{t("orders.noOrders")}</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("orders.createdAt")}</TableHead>
              <TableHead>{t("orders.customer")}</TableHead>
              <TableHead>{t("orders.product")}</TableHead>
              <TableHead>{t("orders.branch")}</TableHead>
              <TableHead>{t("orders.status")}</TableHead>
              <TableHead className="text-right">{t("orders.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const specsSummary = order.specs
                ? Object.values(order.specs).filter(Boolean).join(" • ")
                : null

              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => onSelectOrder(order)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">
                      {order.customerName}
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="size-3 text-emerald-600" />
                      {order.customerPhone}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-foreground">
                      <span className="font-semibold text-muted-foreground uppercase text-[10px] mr-1">
                        {order.brand}
                      </span>
                      {order.modelName || order.productName}
                    </div>
                    {specsSummary && (
                      <div className="text-[11px] text-muted-foreground">
                        {specsSummary}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-foreground whitespace-nowrap">
                    {order.storeName}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.statusCode} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectOrder(order)
                      }}
                      className="size-8 p-0 rounded-full"
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
