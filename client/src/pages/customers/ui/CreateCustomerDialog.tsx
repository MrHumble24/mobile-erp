import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCreateCustomer } from "@/entities/customer"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

interface CustomerFieldsProps {
  name: string
  setName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}

function CustomerFields({
  name,
  setName,
  phone,
  setPhone,
  notes,
  setNotes,
}: CustomerFieldsProps) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("sales.customerName")}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ali Valiyev"
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{t("sales.customerPhone")}</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998901234567"
        />
      </div>

      <div className="space-y-1">
        <Label>{t("sales.customerNotes")}</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Doimiy mijoz..."
        />
      </div>
    </>
  )
}

function CreateCustomerForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const createMutation = useCreateCustomer()
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createMutation.mutate(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("sales.customerSaved"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => {
          toast.error(err?.message || t("common.error"))
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <CustomerFields
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        notes={notes}
        setNotes={setNotes}
      />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  )
}

export function CreateCustomerDialog({
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
          <DialogTitle>{t("sales.newCustomer")}</DialogTitle>
        </DialogHeader>

        {open && (
          <CreateCustomerForm
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
