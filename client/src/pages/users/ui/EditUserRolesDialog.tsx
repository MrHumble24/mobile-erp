import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useRoles, useSetUserRoles, type UserView } from "@/entities/user"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { toast } from "@/shared/ui/sonner"

function RoleCheckboxList({
  roles,
  selectedRoles,
  onToggle,
}: {
  roles?: Array<{ code: string; name: string }>
  selectedRoles: string[]
  onToggle: (code: string) => void
}) {
  return (
    <div className="space-y-2 p-3 bg-muted/40 rounded-lg max-h-48 overflow-y-auto">
      {roles?.map((r) => (
        <label key={r.code} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Checkbox
            checked={selectedRoles.includes(r.code)}
            onCheckedChange={() => onToggle(r.code)}
          />
          <span>{r.name}</span>
        </label>
      ))}
    </div>
  )
}

function EditRolesForm({
  user,
  onCancel,
  onSuccess,
}: {
  user: UserView
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const setRolesMutation = useSetUserRoles()
  const { data: roles } = useRoles()
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>(user.roles || [])

  const handleToggle = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRolesMutation.mutate(
      { id: user.id, dto: { roleCodes: selectedRoles } },
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
      <RoleCheckboxList
        roles={roles}
        selectedRoles={selectedRoles}
        onToggle={handleToggle}
      />
      <Button type="submit" className="w-full" disabled={setRolesMutation.isPending}>
        {setRolesMutation.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  )
}

export function EditUserRolesDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: UserView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("users.editUser")}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        {open && <EditRolesForm user={user} onCancel={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </DialogPopup>
    </Dialog>
  )
}
