import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { usePartners, type PartnerView } from "@/entities/partner"
import type { ConsignmentView } from "@/entities/consignment"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"
import { useConsignForm } from "../model/use-consign-form"
import { ConsignDeviceRow } from "./ConsignDeviceRow"

function consignErrorMessage(err: any, t: (k: string) => string): string {
  if (err?.creditLimit !== undefined) {
    return `${t("consignments.creditLimitExceeded")}. Limit: $${err.creditLimit}, Qarz: $${err.outstanding}, Jami: $${err.projected}`
  }
  return err?.statusCode === 409 ? t("common.retry") : err?.message || t("common.error")
}

function PartnerSelectField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const { data: partners } = usePartners()
  return (
    <div className="space-y-1">
      <Label>{t("consignments.partner")}</Label>
      <Select value={value} onValueChange={(val) => onChange(val || "")} disabled={disabled}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={t("consignments.selectPartner")} />
        </SelectTrigger>
        <SelectContent>
          {partners?.filter((p: PartnerView) => p.isActive).map((p: PartnerView) => (
            <SelectItem key={p.id} value={p.id}>{p.shopName}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ConsignDeviceForm({
  initialImei,
  initialAgreedPrice,
  initialPartnerId,
  lockPartner,
  onCancel,
  onSuccess,
}: {
  initialImei?: string
  initialAgreedPrice?: string
  initialPartnerId?: string
  lockPartner?: boolean
  onCancel: () => void
  onSuccess?: (consignment: ConsignmentView) => void
}) {
  const { t } = useI18n()
  const form = useConsignForm({ initialImei, initialAgreedPrice, initialPartnerId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.partnerId || !form.dueDate) return
    if (!form.rows.some((r) => r.imei.trim() && r.agreedPrice)) return

    const { created, queued, error } = await form.submit()
    if (created.length > 0) {
      toast.success(created.length > 1 ? t("consignments.batchSuccess") : t("consignments.consignSuccess"))
    }
    if (queued > 0) toast.success(t("sync.queuedConsign", { count: queued }))
    if (error) {
      toast.error(consignErrorMessage(error, t))
      return
    }
    onCancel()
    if (created.length > 0) onSuccess?.(created[created.length - 1])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <PartnerSelectField value={form.partnerId} onChange={form.setPartnerId} disabled={lockPartner} />

      <div className="space-y-2">
        {form.rows.map((row, i) => (
          <ConsignDeviceRow
            key={row.key}
            row={row}
            index={i}
            canRemove={form.rows.length > 1}
            onChange={(patch) => form.updateRow(row.key, patch)}
            onRemove={() => form.removeRow(row.key)}
          />
        ))}
        <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={form.addRow}>
          <Plus className="size-4" />
          {t("consignments.addDevice")}
        </Button>
      </div>

      <div className="space-y-1">
        <Label>{t("consignments.dueDate")}</Label>
        <Input type="date" value={form.dueDate} onChange={(e) => form.setDueDate(e.target.value)} className="h-10" required />
      </div>
      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input value={form.notes} onChange={(e) => form.setNotes(e.target.value)} placeholder="Qo'shimcha shartlar..." className="h-10" />
      </div>

      <Button type="submit" className="w-full" disabled={form.isPending}>
        {form.isPending ? t("common.loading") : t("consignments.newConsignment")}
      </Button>
    </form>
  )
}
