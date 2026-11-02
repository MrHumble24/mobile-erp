import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCartStore } from "@/features/checkout"
import { useCreateSale, type CreateSaleDto } from "@/entities/sale"
import { useSettings } from "@/entities/settings"
import { deviceRepository } from "@/entities/device"
import { toast } from "@/shared/ui/sonner"

function toSalePayload(cart: ReturnType<typeof useCartStore.getState>): CreateSaleDto | null {
  if (!cart.device) return null
  return {
    imei: cart.device.imei,
    salePrice: cart.salePrice,
    customerId: cart.customer?.id,
    customer: !cart.customer?.id && cart.customer?.name ? { name: cart.customer.name, phone: cart.customer.phone } : undefined,
    warrantyDays: cart.warrantyDays,
    notes: cart.notes || undefined,
    clientMutationId: cart.clientMutationId,
    expectedVersion: cart.device.version,
  }
}

export function usePosTerminal() {
  const { t } = useI18n()
  const { data: settings } = useSettings()
  const createSaleMutation = useCreateSale()
  const [scannedImei, setScannedImei] = React.useState("")
  const [completedSaleId, setCompletedSaleId] = React.useState<string | null>(null)
  const [receiptOpen, setReceiptOpen] = React.useState(false)
  const cart = useCartStore()

  const handleScan = async (imei: string) => {
    try {
      const dev = await deviceRepository.getByImei(imei)
      if (dev.statusCode !== "IN_STOCK") {
        toast.error(`Qurilma sotuvga tayyor emas (${dev.statusCode})`)
        return
      }
      cart.setDevice(dev, settings?.defaultWarrantyDays || 14)
      setScannedImei("")
      toast.success("Qurilma tanlandi")
    } catch {
      toast.error(t("common.notFound"))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = toSalePayload(cart)
    if (!payload) return
    createSaleMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(t("pos.saleSuccess"))
        setCompletedSaleId(res.id)
        setReceiptOpen(true)
        cart.resetCart()
      },
      onError: (err: any) => {
        toast.error(err?.statusCode === 409 ? t("common.retry") : (err?.message || t("common.error")))
      },
    })
  }

  return {
    scannedImei,
    setScannedImei,
    handleScan,
    handleSubmit,
    isPending: createSaleMutation.isPending,
    completedSaleId,
    receiptOpen,
    setReceiptOpen,
    cart,
  }
}
