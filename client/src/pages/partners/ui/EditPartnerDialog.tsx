import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useUpdatePartner, type PartnerView, type UpdatePartnerDto } from "@/entities/partner"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/sonner"

interface FormState {
  shopName: string
  contactPerson: string
  phone: string
  telegramHandle: string
  creditLimit: string
  notes: string
  isActive: boolean
}

function initialState(p: PartnerView): FormState {
  return {
    shopName: p.shopName,
    contactPerson: p.contactPerson ?? "",
    phone: p.phone ?? "",
    telegramHandle: p.telegramHandle ?? "",
    creditLimit: String(Number(p.creditLimit)),
    notes: p.notes ?? "",
    isActive: p.isActive,
  }
}

function TextField({ label, value, onChange, ...rest }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  className?: string
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  )
}

function EditPartnerForm({ partner, onDone }: { partner: PartnerView; onDone: () => void }) {
  const { t } = useI18n()
  const updateMutation = useUpdatePartner()
  const [form, setForm] = React.useState<FormState>(() => initialState(partner))
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shopName.trim()) return
    const dto: UpdatePartnerDto = {
      shopName: form.shopName.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      telegramHandle: form.telegramHandle.trim() || undefined,
      creditLimit: Number(form.creditLimit) || 0,
      notes: form.notes.trim() || undefined,
      isActive: form.isActive,
    }
    updateMutation.mutate(
      { id: partner.id, dto },
      {
        onSuccess: () => {
          toast.success(t("partners.updateSuccess"))
          onDone()
        },
        onError: (err: any) => toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 my-2">
      <TextField label={t("partners.name")} value={form.shopName} onChange={(v) => set({ shopName: v })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t("partners.contactPerson")} value={form.contactPerson} onChange={(v) => set({ contactPerson: v })} />
        <TextField label={t("partners.phone")} value={form.phone} onChange={(v) => set({ phone: v })} />
      </div>
      <TextField label={t("partners.telegramHandle")} value={form.telegramHandle} onChange={(v) => set({ telegramHandle: v })} />
      <TextField label={t("partners.creditLimit")} value={form.creditLimit} onChange={(v) => set({ creditLimit: v })} type="number" className="font-mono" />
      <TextField label={t("common.notes")} value={form.notes} onChange={(v) => set({ notes: v })} />
      <div className="flex items-center gap-2">
        <Switch checked={form.isActive} onCheckedChange={(v) => set({ isActive: v })} />
        <Label className="cursor-pointer">{t("partners.active")}</Label>
      </div>
      <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  )
}

export function EditPartnerDialog({
  partner,
  open,
  onOpenChange,
}: {
  partner: PartnerView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  if (!partner) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("partners.editPartner")}</DialogTitle>
        </DialogHeader>
        {open && <EditPartnerForm partner={partner} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
