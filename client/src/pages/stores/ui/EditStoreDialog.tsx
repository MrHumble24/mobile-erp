import * as React from "react"
import { useUpdateStore, type StoreView } from "@/entities/store"
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

export function EditStoreDialog({
  store,
  open,
  onOpenChange,
}: {
  store: StoreView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const updateMutation = useUpdateStore()
  const [name, setName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [phone, setPhone] = React.useState("")

  React.useEffect(() => {
    if (store) {
      setName(store.name)
      setAddress(store.address || "")
      setPhone(store.phone || "")
    }
  }, [store])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || !name.trim()) return

    updateMutation.mutate(
      {
        id: store.id,
        dto: {
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("stores.saved"))
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
          <DialogTitle>{t("stores.editStore")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1">
            <Label>{t("stores.storeName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>{t("stores.address")}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("stores.phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
