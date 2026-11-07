import { Smartphone } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { LedgerTransaction } from "@/entities/ledger"

function Dash() {
  return <span className="text-sm text-muted-foreground/40 font-mono">—</span>
}

/**
 * Rich source context renderer:
 * Displays device model name, IMEI, customer, supplier, expense category, or note.
 */
export function TransactionDetails({ tx }: { tx: LedgerTransaction }) {
  const { t } = useI18n()

  // 1. Device Purchase / Device Expense / Customs with device
  if (tx.device) {
    const modelName = tx.device.model?.name || t("balance.device")
    const imei = tx.device.imei
    const supplierName = tx.shipment?.supplier?.name
    return (
      <div className="flex flex-col gap-0.5 max-w-[320px]">
        <div className="flex items-center gap-1.5 font-medium text-xs text-foreground truncate">
          <Smartphone className="size-3 text-muted-foreground shrink-0" />
          <span className="truncate">{modelName}</span>
          {imei && (
            <span className="font-mono text-[10px] text-muted-foreground/80 bg-muted/50 px-1 py-0.5 rounded shrink-0">
              {imei.slice(-6)}
            </span>
          )}
        </div>
        {supplierName ? (
          <span className="text-[11px] text-muted-foreground truncate">
            {t("balance.supplier")}: {supplierName}
          </span>
        ) : tx.note ? (
          <span className="text-[11px] text-muted-foreground truncate">{tx.note}</span>
        ) : null}
      </div>
    )
  }

  // 2. Sale
  if (tx.sale) {
    const customer = tx.sale.customer?.name
    const modelName = tx.sale.device?.model?.name || tx.sale.model?.name
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {modelName ? `${modelName}` : t("balance.typeSale")}
        </span>
        {customer && (
          <span className="text-[11px] text-muted-foreground truncate">
            {t("balance.customer")}: {customer}
          </span>
        )}
      </div>
    )
  }

  // 3. Expense
  if (tx.expense) {
    const category = tx.expense.category?.name
    const desc = tx.expense.description || tx.expense.vendor
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        {category && (
          <span className="font-medium text-xs text-foreground truncate">
            {category}
          </span>
        )}
        {desc && (
          <span className="text-[11px] text-muted-foreground truncate">
            {desc}
          </span>
        )}
      </div>
    )
  }

  // 4. Partner payment
  if (tx.partnerPayment?.partner) {
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {tx.partnerPayment.partner.shopName}
        </span>
        {tx.note && <span className="text-[11px] text-muted-foreground truncate">{tx.note}</span>}
      </div>
    )
  }

  // 5. Customer purchase
  if (tx.customerPurchase) {
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {tx.customerPurchase.device?.model?.name || t("balance.typeCustomerPurchase")}
        </span>
        {tx.customerPurchase.customer && (
          <span className="text-[11px] text-muted-foreground truncate">
            {t("balance.customer")}: {tx.customerPurchase.customer.name}
          </span>
        )}
      </div>
    )
  }

  // 6. Repair payment
  if (tx.repairPayment?.repair) {
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {tx.repairPayment.repair.deviceName} (#{tx.repairPayment.repair.ticketNumber})
        </span>
        {tx.repairPayment.repair.customer && (
          <span className="text-[11px] text-muted-foreground truncate">
            {tx.repairPayment.repair.customer.name}
          </span>
        )}
      </div>
    )
  }

  // 7. Fallback to Note
  if (tx.note) {
    return (
      <span className="text-xs text-foreground/90 max-w-[300px] truncate block" title={tx.note}>
        {tx.note}
      </span>
    )
  }

  return <Dash />
}
