import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSuppliers, type SupplierView } from "@/entities/supplier"
import { useCreateShipment } from "@/entities/shipment"
import { AccountSelect } from "@/entities/ledger"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"
import { SupplierCreateDialog } from "./SupplierCreateDialog"

function SupplierSelectField({
  supplierId,
  onSelectSupplier,
  suppliers,
}: {
  supplierId: string
  onSelectSupplier: (id: string) => void
  suppliers: SupplierView[]
}) {
  const { t } = useI18n()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{t("shipments.supplier")}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          {t("shipments.newSupplier")}
        </Button>
      </div>
      <Select value={supplierId} onValueChange={(val) => onSelectSupplier(val || "")}>
        <SelectTrigger className="h-10"><SelectValue placeholder={t("common.select")} /></SelectTrigger>
        <SelectContent>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SupplierCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={onSelectSupplier} />
    </div>
  )
}

function ShipmentParamFields({
  date,
  onDateChange,
  count,
  onCountChange,
}: {
  date: string
  onDateChange: (val: string) => void
  count: number
  onCountChange: (val: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>{t("shipments.shipmentDate")}</Label>
        <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="h-10" />
      </div>
      <div className="space-y-2">
        <Label>{t("shipments.expectedCount")}</Label>
        <Input type="number" min={1} value={count} onChange={(e) => onCountChange(Number(e.target.value))} className="h-10" />
      </div>
    </div>
  )
}

export function ShipmentCreateForm({ onSuccess }: { onSuccess: (shipmentId: string) => void }) {
  const { t } = useI18n()
  const { data: suppliersData } = useSuppliers()
  const createShipmentMutation = useCreateShipment()

  const [supplierId, setSupplierId] = React.useState("")
  const [shipmentDate, setShipmentDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [expectedCount, setExpectedCount] = React.useState(10)
  const [paymentAccountCode, setPaymentAccountCode] = React.useState("CASH")
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      toast.error(t("shipments.selectSupplier"))
      return
    }
    createShipmentMutation.mutate(
      {
        supplierId,
        shipmentDate: new Date(shipmentDate).toISOString(),
        expectedCount,
        paymentAccountCode,
        notes: notes || undefined,
      },
      { onSuccess: (res) => { toast.success(t("common.success")); onSuccess(res.id) } }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SupplierSelectField supplierId={supplierId} onSelectSupplier={setSupplierId} suppliers={suppliersData || []} />
      <ShipmentParamFields
        date={shipmentDate}
        onDateChange={setShipmentDate}
        count={expectedCount}
        onCountChange={setExpectedCount}
      />
      <div className="space-y-2">
        <Label>{t("balance.payFrom")}</Label>
        <AccountSelect value={paymentAccountCode} onValueChange={setPaymentAccountCode} />
      </div>
      <div className="space-y-2">
        <Label>{t("common.notes")}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10" />
      </div>
      <Button type="submit" className="w-full" disabled={createShipmentMutation.isPending}>
        {createShipmentMutation.isPending ? t("common.loading") : t("shipments.createShipment")}
      </Button>
    </form>
  )
}
