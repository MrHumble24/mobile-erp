import * as React from "react"
import { useCreateStore } from "@/entities/store"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

export function CreateStoreDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const createMutation = useCreateStore()
  const [name, setName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [phone, setPhone] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createMutation.mutate(
      {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("stores.saved"))
          setName("")
          setAddress("")
          setPhone("")
          onOpenChange(false)
        },
        onError: (err: { message?: string }) =>
          toast.error(err?.message || t("common.error")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("stores.newStore")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1">
            <Label>{t("stores.storeName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t("stores.namePlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("stores.address")}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("stores.addressPlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("stores.phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998..."
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? t("common.loading") : t("common.create")}
          </Button>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
