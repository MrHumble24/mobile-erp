import * as React from "react"
import { useStores } from "@/entities/store"
import { useCreateUser, useRoles } from "@/entities/user"
import { useI18n } from "@/shared/i18n"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Checkbox } from "@/shared/ui/checkbox"
import { toast } from "@/shared/ui/sonner"

function UserFormFields({
  email,
  setEmail,
  password,
  setPassword,
  firstName,
  setFirstName,
  phone,
  setPhone,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  firstName: string
  setFirstName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("users.fullName")}</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>{t("common.phone")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+99890..." />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{t("users.email")}</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>{t("users.password")}</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
    </>
  )
}

function RoleCheckboxes({
  selectedRoles,
  onToggle,
}: {
  selectedRoles: string[]
  onToggle: (code: string) => void
}) {
  const { t } = useI18n()
  const { data: roles } = useRoles()

  return (
    <div className="space-y-2">
      <Label>{t("users.roles")}</Label>
      <div className="grid grid-cols-2 gap-2 p-3 bg-muted border border-border rounded-[12px] max-h-32 overflow-y-auto">
        {roles?.map((r) => (
          <label key={r.code} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              checked={selectedRoles.includes(r.code)}
              onCheckedChange={() => onToggle(r.code)}
            />
            <span>{r.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function StoreCheckboxes({
  selectedStores,
  onToggle,
}: {
  selectedStores: string[]
  onToggle: (id: string) => void
}) {
  const { t } = useI18n()
  const { data: stores } = useStores()

  if (!stores || stores.length === 0) return null

  return (
    <div className="space-y-2">
      <Label>{t("users.stores")}</Label>
      <div className="grid grid-cols-2 gap-2 p-3 bg-muted border border-border rounded-[12px] max-h-32 overflow-y-auto">
        {stores.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              checked={selectedStores.includes(s.id)}
              onCheckedChange={() => onToggle(s.id)}
            />
            <span>{s.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function CreateUserForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess?: () => void }) {
  const { t } = useI18n()
  const createMutation = useCreateUser()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [firstName, setFirstName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([])
  const [selectedStores, setSelectedStores] = React.useState<string[]>([])

  const handleToggle = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleToggleStore = (id: string) => {
    setSelectedStores((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !firstName) return

    createMutation.mutate(
      {
        email: email.trim(),
        password,
        profile: { firstName: firstName.trim(), phone: phone.trim() || undefined },
        roleCodes: selectedRoles,
        storeIds: selectedStores.length > 0 ? selectedStores : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("users.userSaved"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: { message?: string }) =>
          toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <UserFormFields
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        firstName={firstName} setFirstName={setFirstName}
        phone={phone} setPhone={setPhone}
      />
      <RoleCheckboxes selectedRoles={selectedRoles} onToggle={handleToggle} />
      <StoreCheckboxes selectedStores={selectedStores} onToggle={handleToggleStore} />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("common.create")}
      </Button>
    </form>
  )
}

export function CreateUserDialog({
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
          <DialogTitle>{t("users.newUser")}</DialogTitle>
        </DialogHeader>
        {open && <CreateUserForm onCancel={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </DialogPopup>
    </Dialog>
  )
}
