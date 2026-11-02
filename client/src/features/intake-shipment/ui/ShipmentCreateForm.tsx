import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useSuppliers, useCreateSupplier, type SupplierView } from "@/entities/supplier"
import { useCreateShipment } from "@/entities/shipment"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

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
  const [isAdding, setIsAdding] = React.useState(false)
  const [name, setName] = React.useState("")
  const createSupplierMutation = useCreateSupplier()

  const handleAdd = () => {
    if (!name.trim()) return
    createSupplierMutation.mutate({ name: name.trim() }, {
      onSuccess: (sup) => {
        onSelectSupplier(sup.id)
        setIsAdding(false)
        setName("")
      },
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{t("shipments.supplier")}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? t("common.cancel") : `+ ${t("shipments.newSupplier")}`}
        </Button>
      </div>
      {isAdding ? (
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("shipments.supplierName")} className="h-10" />
          <Button type="button" onClick={handleAdd} disabled={createSupplierMutation.isPending}>{t("common.add")}</Button>
        </div>
      ) : (
        <Select value={supplierId} onValueChange={(val) => onSelectSupplier(val || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder={t("common.select")} /></SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

function ShipmentParamFields({
  date,
  onDateChange,
  count,
  onCountChange,
  cost,
  onCostChange,
}: {
  date: string
  onDateChange: (val: string) => void
  count: number
  onCountChange: (val: number) => void
  cost: number
  onCostChange: (val: number) => void
}) {
  const { t } = useI18n()
  return (
    <>
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
      <div className="space-y-2">
        <Label>{t("shipments.overheadCost")}</Label>
        <Input type="number" min={0} value={cost} onChange={(e) => onCostChange(Number(e.target.value))} className="h-10" />
      </div>
    </>
  )
}

export function ShipmentCreateForm({ onSuccess }: { onSuccess: (shipmentId: string) => void }) {
  const { t } = useI18n()
  const { data: suppliersData } = useSuppliers()
  const createShipmentMutation = useCreateShipment()

  const [supplierId, setSupplierId] = React.useState("")
  const [shipmentDate, setShipmentDate] = React.useState("2026-11-01")
  const [expectedCount, setExpectedCount] = React.useState(10)
  const [overheadCost, setOverheadCost] = React.useState(0)
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      toast.error("Yetkazib beruvchini tanlang")
      return
    }
    createShipmentMutation.mutate(
      { supplierId, shipmentDate, expectedCount, overheadCost, notes: notes || undefined },
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
        cost={overheadCost}
        onCostChange={setOverheadCost}
      />
      <div className="space-y-2">
        <Label>{t("common.notes")}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="..." className="h-10" />
      </div>
      <Button type="submit" className="w-full" disabled={createShipmentMutation.isPending}>
        {createShipmentMutation.isPending ? t("common.loading") : t("shipments.intakeDevices")}
      </Button>
    </form>
  )
}
