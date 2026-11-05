import { Pencil } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import { useCustomer, type CustomerView } from "@/entities/customer"
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { CustomerPurchaseList } from "./CustomerPurchaseList"
import { CustomerCreditsList } from "./CustomerCreditsList"

function levelLabel(code: string, t: (k: string) => string): string {
  if (code === "WHOLESALE") return t("pricing.levelWholesale")
  if (code === "PARTNER") return t("pricing.levelPartner")
  return t("pricing.levelRetail")
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  )
}

function DetailBody({
  customerId,
  onEdit,
}: {
  customerId: string
  onEdit: (customer: CustomerView) => void
}) {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("customer.manage"))
  const { data: customer, isLoading } = useCustomer(customerId)

  if (isLoading || !customer) {
    return <Skeleton className="h-64 rounded-[14px]" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">{customer.name}</div>
          <div className="text-sm text-muted-foreground font-mono">{customer.phone || "—"}</div>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(customer)}>
            <Pencil className="size-3.5" />
            {t("customers.edit")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label={t("customers.statPurchases")} value={String(customer.purchaseCount)} />
        <Stat label={t("customers.statTotalSpent")} value={formatMoney(customer.totalSpent)} />
        <Stat
          label={t("customers.statLastPurchase")}
          value={customer.lastPurchaseAt ? formatDate(customer.lastPurchaseAt) : "—"}
        />
        <Stat label={t("customers.statActiveWarranties")} value={String(customer.activeWarranties)} />
        <Stat label={t("customers.statReturns")} value={String(customer.returnsCount)} />
        <Stat label={t("customers.statSince")} value={formatDate(customer.createdAt)} />
        <Stat label={t("pricing.customerType")} value={levelLabel(customer.priceLevelCode, t)} />
        <Stat
          label={t("pricing.standingDiscount")}
          value={`${Number(customer.standingDiscountPercent ?? 0)}%`}
        />
      </div>

      {customer.notes && (
        <div className="text-xs text-muted-foreground bg-[#f8f9fa] border border-[#e8e8e8] p-2.5 rounded-[12px]">
          {customer.notes}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label={t("credit.outstanding")} value={formatMoney(customer.creditOutstanding)} />
        <Stat label={t("credit.overdueAmount")} value={formatMoney(customer.creditOverdue)} />
        <Stat
          label={t("credit.effectiveLimit")}
          value={
            customer.effectiveCreditLimit === null
              ? t("credit.noLimit")
              : formatMoney(customer.effectiveCreditLimit)
          }
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">{t("credit.title")}</h3>
        <CustomerCreditsList customerId={customer.id} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">{t("customers.purchaseHistory")}</h3>
        <CustomerPurchaseList customerId={customer.id} />
      </div>
    </div>
  )
}

export function CustomerDetailSheet({
  customerId,
  open,
  onOpenChange,
  onEdit,
}: {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (customer: CustomerView) => void
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="space-y-6">
        <SheetHeader>
          <SheetTitle>{t("customers.detailTitle")}</SheetTitle>
          <SheetDescription>{t("customers.detailHint")}</SheetDescription>
        </SheetHeader>
        {customerId && <DetailBody customerId={customerId} onEdit={onEdit} />}
      </SheetPopup>
    </Sheet>
  )
}
