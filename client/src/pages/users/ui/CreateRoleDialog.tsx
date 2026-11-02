import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCreateRole } from "@/entities/user"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function CreateRoleForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess?: () => void }) {
  const { t } = useI18n()
  const createMutation = useCreateRole()
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    createMutation.mutate(
      { code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("users.roleSaved"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <div className="space-y-1">
        <Label>{t("users.roleCode")}</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CASHIER"
          className="font-mono uppercase"
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{t("users.roleName")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kassir" required />
      </div>

      <div className="space-y-1">
        <Label>{t("users.description")}</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tavsifi..." />
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("common.create")}
      </Button>
    </form>
  )
}

export function CreateRoleDialog({
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
          <DialogTitle>{t("users.newRole")}</DialogTitle>
        </DialogHeader>
        {open && <CreateRoleForm onCancel={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </DialogPopup>
    </Dialog>
  )
}
