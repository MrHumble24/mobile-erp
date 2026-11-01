import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCustomers, type CustomerView } from "@/entities/customer"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { CartCustomer } from "../model/cart.store"

function InlineCustomerFields({
  name,
  phone,
  onChange,
}: {
  name: string
  phone: string
  onChange: (n: string, p: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        value={name}
        onChange={(e) => onChange(e.target.value, phone)}
        placeholder={t("pos.customerName")}
        className="h-10"
      />
      <Input
        value={phone}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={t("pos.customerPhone")}
        className="h-10"
      />
    </div>
  )
}

function ExistingCustomerSelect({
  selectedId,
  customers,
  onSelect,
}: {
  selectedId?: string
  customers: CustomerView[]
  onSelect: (id: string) => void
}) {
  const { t } = useI18n()
  return (
    <Select value={selectedId || "none"} onValueChange={(val) => onSelect(val || "none")}>
      <SelectTrigger className="h-10"><SelectValue placeholder={t("pos.searchCustomer")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">-- {t("common.optional")} --</SelectItem>
        {customers.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CustomerSelectFields({
  customer,
  onCustomerChange,
}: {
  customer: CartCustomer | null
  onCustomerChange: (cust: CartCustomer | null) => void
}) {
  const { t } = useI18n()
  const [isInline, setIsInline] = React.useState(false)
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const { data: customersData } = useCustomers()

  const handleSelect = (id: string) => {
    if (id === "none") return onCustomerChange(null)
    const found = customersData?.find((c) => c.id === id)
    if (found) onCustomerChange({ id: found.id, name: found.name, phone: found.phone || undefined })
  }

  const handleInlineChange = (nextName: string, nextPhone: string) => {
    setName(nextName)
    setPhone(nextPhone)
    onCustomerChange(nextName.trim() ? { name: nextName.trim(), phone: nextPhone.trim() || undefined } : null)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{t("pos.customer")} ({t("common.optional")})</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setIsInline(!isInline); onCustomerChange(null) }}>
          {isInline ? t("pos.selectCustomer") : `+ ${t("pos.newCustomer")}`}
        </Button>
      </div>
      {isInline ? (
        <InlineCustomerFields name={name} phone={phone} onChange={handleInlineChange} />
      ) : (
        <ExistingCustomerSelect selectedId={customer?.id} customers={customersData || []} onSelect={handleSelect} />
      )}
    </div>
  )
}
