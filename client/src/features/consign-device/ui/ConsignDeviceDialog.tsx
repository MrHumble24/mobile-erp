import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { usePartners } from "@/entities/partner"
import { useCreateConsignment, type ConsignmentView } from "@/entities/consignment"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

function PartnerSelectField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useI18n()
  const { data: partners } = usePartners()

  return (
    <div className="space-y-1">
      <Label>{t("consignments.partner")}</Label>
      <Select value={value} onValueChange={(val) => onChange(val || "")}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={t("consignments.selectPartner")} />
        </SelectTrigger>
        <SelectContent>
          {partners?.filter((p) => p.isActive).map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.shopName}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PricingRow({
  agreedPrice,
  setAgreedPrice,
  dueDate,
  setDueDate,
}: {
  agreedPrice: string
  setAgreedPrice: (v: string) => void
  dueDate: string
  setDueDate: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>{t("consignments.agreedPrice")}</Label>
        <Input
          type="number"
          min={0}
          value={agreedPrice}
          onChange={(e) => setAgreedPrice(e.target.value)}
          className="h-10 font-mono font-bold"
          required
        />
      </div>
      <div className="space-y-1">
        <Label>{t("consignments.dueDate")}</Label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-10"
          required
        />
      </div>
    </div>
  )
}

function ConsignFormInputs({
  partnerId,
  setPartnerId,
  imei,
  setImei,
  agreedPrice,
  setAgreedPrice,
  dueDate,
  setDueDate,
  notes,
  setNotes,
}: {
  partnerId: string
  setPartnerId: (v: string) => void
  imei: string
  setImei: (v: string) => void
  agreedPrice: string
  setAgreedPrice: (v: string) => void
  dueDate: string
  setDueDate: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <PartnerSelectField value={partnerId} onChange={setPartnerId} />
      <div className="space-y-1">
        <Label>{t("consignments.device")}</Label>
        <BarcodeInput
          value={imei}
          onChange={(e) => setImei(e.target.value)}
          onScan={(code) => setImei(code.trim())}
          onClear={() => setImei("")}
          placeholder="IMEI (15 xona)..."
        />
      </div>
      <PricingRow agreedPrice={agreedPrice} setAgreedPrice={setAgreedPrice} dueDate={dueDate} setDueDate={setDueDate} />
      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qo'shimcha shartlar..." className="h-10" />
      </div>
    </>
  )
}

function consignErrorMessage(err: any, t: (k: string) => string): string {
  if (err?.creditLimit !== undefined) {
    return `${t("consignments.creditLimitExceeded")}. Limit: $${err.creditLimit}, Qarz: $${err.outstanding}, Jami: $${err.projected}`
  }
  return err?.statusCode === 409 ? t("common.retry") : err?.message || t("common.error")
}

function ConsignDeviceForm({
  onCancel,
  onSuccess,
  initialImei = "",
  initialAgreedPrice = "",
}: {
  onCancel: () => void
  onSuccess?: (consignment: ConsignmentView) => void
  initialImei?: string
  initialAgreedPrice?: string
}) {
  const { t } = useI18n()
  const createMutation = useCreateConsignment()
  const [partnerId, setPartnerId] = React.useState("")
  const [imei, setImei] = React.useState(initialImei)
  const [agreedPrice, setAgreedPrice] = React.useState(initialAgreedPrice)
  const [dueDate, setDueDate] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerId || !imei.trim() || !agreedPrice || !dueDate) return

    const dto = {
      partnerId,
      imei: imei.trim(),
      agreedPrice: Number(agreedPrice),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes.trim() || undefined,
      clientMutationId: crypto.randomUUID(),
    }

    createMutation.mutate(dto, {
      onSuccess: (created) => {
        toast.success(t("consignments.consignSuccess"))
        onCancel()
        onSuccess?.(created)
      },
      onError: (err: any) => toast.error(consignErrorMessage(err, t)),
    })
  }

  const inputProps = { partnerId, setPartnerId, imei, setImei, agreedPrice, setAgreedPrice, dueDate, setDueDate, notes, setNotes }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <ConsignFormInputs {...inputProps} />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("consignments.newConsignment")}
      </Button>
    </form>
  )
}

export function ConsignDeviceDialog({
  open,
  onOpenChange,
  onSuccess,
  initialImei,
  initialAgreedPrice,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (consignment: ConsignmentView) => void
  initialImei?: string
  initialAgreedPrice?: string
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("consignments.newConsignment")}</DialogTitle>
        </DialogHeader>
        {open && (
          <ConsignDeviceForm
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
            initialImei={initialImei}
            initialAgreedPrice={initialAgreedPrice}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
