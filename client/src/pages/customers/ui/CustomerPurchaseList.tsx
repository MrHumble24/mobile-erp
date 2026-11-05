import * as React from "react"
import { Receipt, Smartphone } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { useCustomerSales, type CustomerSaleView } from "@/entities/customer"
import { DeviceDrawer } from "@/widgets/device-drawer"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { Skeleton } from "@/shared/ui/skeleton"
import { CustomerWarrantyBadge } from "./CustomerWarrantyBadge"

function PurchaseItem({
  sale,
  onOpenDevice,
}: {
  sale: CustomerSaleView
  onOpenDevice: (imei: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="p-3.5 border border-[#e8e8e8] rounded-[14px] bg-[#f8f9fa] space-y-2 text-sm shadow-[var(--shadow-xs)]">
      <div className="flex justify-between items-start gap-2">
        <div className="font-semibold">
          {sale.device.model?.brand} {sale.device.model?.name}
        </div>
        <div className="font-mono font-bold">{formatMoney(sale.salePrice)}</div>
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>{unitCode(sale.device)}</span>
        <span>{formatDate(sale.soldAt)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <CustomerWarrantyBadge sale={sale} />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label={t("customers.openDevice")}
            title={t("customers.openDevice")}
            onClick={() => onOpenDevice(unitCode(sale.device))}
          >
            <Smartphone className="size-4" />
          </Button>
          <Link
            to={`/sales/${sale.id}/receipt`}
            aria-label={t("customers.openReceipt")}
            title={t("customers.openReceipt")}
            className={buttonVariants({ size: "icon", variant: "ghost", className: "size-8" })}
          >
            <Receipt className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function CustomerPurchaseList({ customerId }: { customerId: string }) {
  const { t } = useI18n()
  const { data: sales, isLoading } = useCustomerSales(customerId)
  const [imei, setImei] = React.useState<string | null>(null)

  if (isLoading) {
    return <Skeleton className="h-40 rounded-[14px]" />
  }
  if (!sales || sales.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("customers.noPurchases")}</p>
  }

  return (
    <>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {sales.map((sale) => (
          <PurchaseItem key={sale.id} sale={sale} onOpenDevice={setImei} />
        ))}
      </div>
      <DeviceDrawer imei={imei} open={Boolean(imei)} onClose={() => setImei(null)} />
    </>
  )
}
