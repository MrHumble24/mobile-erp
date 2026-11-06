import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCreatePartner } from "@/entities/partner"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function PartnerBasicInputs({
  shopName,
  setShopName,
  contactPerson,
  setContactPerson,
  phone,
  setPhone,
}: {
  shopName: string
  setShopName: (v: string) => void
  contactPerson: string
  setContactPerson: (v: string) => void
  phone: string
  setPhone: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("partners.name")}</Label>
        <Input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Store B-12"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("partners.contactPerson")}</Label>
          <Input
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="Nodir aka"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("partners.phone")}</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+99890..."
          />
        </div>
      </div>
    </>
  )
}

function PartnerFinanceInputs({
  creditLimit,
  setCreditLimit,
  notes,
  setNotes,
}: {
  creditLimit: string
  setCreditLimit: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("partners.creditLimit")}</Label>
        <Input
          type="number"
          min={0}
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
          placeholder="0 (cheklovsiz)"
          className="font-mono"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Qo'shimcha ma'lumot..."
        />
      </div>
    </>
  )
}

interface PartnerFormState {
  shopName: string
  setShopName: (v: string) => void
  contactPerson: string
  setContactPerson: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  creditLimit: string
  setCreditLimit: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}

function PartnerAllInputs(props: PartnerFormState) {
  return (
    <>
      <PartnerBasicInputs
        shopName={props.shopName}
        setShopName={props.setShopName}
        contactPerson={props.contactPerson}
        setContactPerson={props.setContactPerson}
        phone={props.phone}
        setPhone={props.setPhone}
      />
      <PartnerFinanceInputs
        creditLimit={props.creditLimit}
        setCreditLimit={props.setCreditLimit}
        notes={props.notes}
        setNotes={props.setNotes}
      />
    </>
  )
}

function CreatePartnerForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const createMutation = useCreatePartner()
  const [shopName, setShopName] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [creditLimit, setCreditLimit] = React.useState("0")
  const [notes, setNotes] = React.useState("")

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim()) return

    const dto = {
      shopName: shopName.trim(),
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      creditLimit: Number(creditLimit) || 0,
      notes: notes.trim() || undefined,
    }

    createMutation.mutate(dto, {
      onSuccess: () => {
        toast.success(t("common.success"))
        onCancel()
        onSuccess?.()
      },
      onError: (err: any) => toast.error(err?.message || t("common.error")),
    })
  }

  const stateProps = {
    shopName, setShopName, contactPerson, setContactPerson,
    phone, setPhone, creditLimit, setCreditLimit, notes, setNotes,
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 my-2">
      <PartnerAllInputs {...stateProps} />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("common.create")}
      </Button>
    </form>
  )
}

export function CreatePartnerDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("partners.newPartner")}</DialogTitle>
        </DialogHeader>
        {open && (
          <CreatePartnerForm
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
