import { useI18n } from "@/shared/i18n"
import { CustomerSelectFields, type CartCustomer } from "@/features/checkout"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"

function WarrantyNotesRow({
  warrantyDays,
  onWarrantyChange,
  notes,
  onNotesChange,
}: {
  warrantyDays: number
  onWarrantyChange: (val: number) => void
  notes: string
  onNotesChange: (val: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>{t("pos.warrantyDays")}</Label>
        <Input type="number" min={0} value={warrantyDays} onChange={(e) => onWarrantyChange(Number(e.target.value))} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="..." className="h-10" />
      </div>
    </div>
  )
}

export function CheckoutParamsForm({
  salePrice,
  onPriceChange,
  customer,
  onCustomerChange,
  warrantyDays,
  onWarrantyChange,
  notes,
  onNotesChange,
  onSubmit,
  isPending,
}: {
  salePrice: number
  onPriceChange: (val: number) => void
  customer: CartCustomer | null
  onCustomerChange: (c: CartCustomer | null) => void
  warrantyDays: number
  onWarrantyChange: (val: number) => void
  notes: string
  onNotesChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}) {
  const { t } = useI18n()

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>{t("pos.salePrice")}</Label>
        <Input
          type="number"
          min={1}
          value={salePrice || ""}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="h-12 text-lg font-bold"
          required
        />
      </div>
      <CustomerSelectFields customer={customer} onCustomerChange={onCustomerChange} />
      <WarrantyNotesRow
        warrantyDays={warrantyDays}
        onWarrantyChange={onWarrantyChange}
        notes={notes}
        onNotesChange={onNotesChange}
      />
      <Button type="submit" size="lg" className="w-full h-12 text-base font-bold" disabled={isPending || salePrice <= 0}>
        {isPending ? t("pos.completingSale") : t("pos.checkoutButton")}
      </Button>
    </form>
  )
}
