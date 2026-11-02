import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCartStore, type CartState } from "@/features/checkout"
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

function useScanImei(cart: CartState, defaultWarrantyDays: number) {
  const { t } = useI18n()
  const [scannedImei, setScannedImei] = React.useState("")

  const handleScan = async (imei: string) => {
    try {
      const dev = await deviceRepository.getByImei(imei)
      if (dev.statusCode !== "IN_STOCK") {
        toast.error(`Qurilma sotuvga tayyor emas (${dev.statusCode})`)
        return
      }
      cart.setDevice(dev, defaultWarrantyDays)
      setScannedImei("")
      toast.success("Qurilma tanlandi")
    } catch {
      toast.error(t("common.notFound"))
    }
  }

  return { scannedImei, setScannedImei, handleScan }
}

export function usePosTerminal() {
  const { t } = useI18n()
  const { data: settings } = useSettings()
  const createSaleMutation = useCreateSale()
  const [completedSaleId, setCompletedSaleId] = React.useState<string | null>(null)
  const [receiptOpen, setReceiptOpen] = React.useState(false)
  const cart = useCartStore()
  const { scannedImei, setScannedImei, handleScan } = useScanImei(cart, settings?.defaultWarrantyDays || 14)

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

  const handleNewSale = React.useCallback(() => {
    setReceiptOpen(false)
    setCompletedSaleId(null)
    setScannedImei("")
    cart.resetCart()
  }, [cart, setScannedImei])

  return {
    scannedImei,
    setScannedImei,
    handleScan,
    handleSubmit,
    handleNewSale,
    isPending: createSaleMutation.isPending,
    completedSaleId,
    receiptOpen,
    setReceiptOpen,
    cart,
  }
}
