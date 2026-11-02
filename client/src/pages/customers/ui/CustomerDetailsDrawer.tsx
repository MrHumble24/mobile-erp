import { useI18n } from "@/shared/i18n"
import {
  type CustomerView,
  type CustomerSaleView,
  useCustomerSales,
} from "@/entities/customer"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"

function CustomerSaleItem({ sale }: { sale: CustomerSaleView }) {
  return (
    <div className="p-3.5 border border-[#e8e8e8] rounded-[14px] bg-[#f8f9fa] space-y-1.5 text-sm shadow-[var(--shadow-xs)]">
      <div className="flex justify-between items-start">
        <div className="font-semibold">
          {sale.device.model?.brand} {sale.device.model?.name}
        </div>
        <div className="font-mono font-bold text-sm">
          ${Number(sale.salePrice).toLocaleString()}
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>{sale.device.imei}</span>
        <span>{new Date(sale.soldAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function CustomerSalesList({ customerId }: { customerId: string }) {
  const { t } = useI18n()
  const { data: sales, isLoading } = useCustomerSales(customerId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
  }

  if (!sales || sales.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("sales.noSalesFound")}</p>
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {sales.map((sale) => (
        <CustomerSaleItem key={sale.id} sale={sale} />
      ))}
    </div>
  )
}

export function CustomerDetailsDrawer({
  customer,
  open,
  onOpenChange,
}: {
  customer: CustomerView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  if (!customer) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="space-y-6">
        <SheetHeader>
          <SheetTitle>{customer.name}</SheetTitle>
          <SheetDescription>{customer.phone || "—"}</SheetDescription>
        </SheetHeader>

        {customer.notes && (
          <div className="text-xs text-muted-foreground bg-[#f8f9fa] border border-[#e8e8e8] p-2.5 rounded-[12px]">
            {customer.notes}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">{t("sales.customerSalesHistory")}</h3>
          <CustomerSalesList customerId={customer.id} />
        </div>
      </SheetPopup>
    </Sheet>
  )
}
