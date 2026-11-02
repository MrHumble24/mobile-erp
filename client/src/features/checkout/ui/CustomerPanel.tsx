import * as React from "react"
import { User, UserPlus, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useCustomerSales } from "@/entities/customer"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { CustomerSearch } from "./CustomerSearch"
import { NewCustomerForm } from "./NewCustomerForm"
import { useCartStore, type CartCustomer } from "../model/cart.store"

export interface CustomerPanelProps {
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
}

function SelectedCustomer({ customer, onClear }: { customer: CartCustomer; onClear: () => void }) {
  const { t } = useI18n()
  const { data: sales } = useCustomerSales(customer.id || "")
  return (
    <div className="flex items-center justify-between rounded-[10px] bg-[#f8f9fa] border border-[#e8e8e8] p-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <User className="size-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{customer.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {customer.phone || t("pos.walkIn")}
            {customer.id && sales ? ` · ${t("pos.purchaseCount", { count: sales.length })}` : ""}
          </p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClear} aria-label={t("common.close")}>
        <X className="size-4" />
      </Button>
    </div>
  )
}

export function CustomerPanel({ searchOpen, onSearchOpenChange }: CustomerPanelProps) {
  const { t } = useI18n()
  const customer = useCartStore((s) => s.customer)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const [isNew, setIsNew] = React.useState(false)

  if (customer) {
    return (
      <div className="space-y-2">
        <Label>{t("pos.customer")}</Label>
        <SelectedCustomer customer={customer} onClear={() => setCustomer(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t("pos.customer")} · {t("pos.walkIn")}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => setIsNew((v) => !v)}
        >
          <UserPlus className="size-3.5" />
          {isNew ? t("pos.searchCustomer") : t("pos.newCustomer")}
        </Button>
      </div>
      {isNew ? (
        <NewCustomerForm
          onAdd={(c) => {
            setCustomer(c)
            setIsNew(false)
          }}
        />
      ) : (
        <CustomerSearch
          open={searchOpen}
          onOpenChange={onSearchOpenChange}
          onSelect={(c) =>
            setCustomer({ id: c.id, name: c.name, phone: c.phone || undefined })
          }
        />
      )}
    </div>
  )
}
