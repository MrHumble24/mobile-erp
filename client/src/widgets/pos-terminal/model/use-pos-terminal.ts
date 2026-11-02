import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import type { DeviceDetailView } from "@/entities/device"
import { useCartStore, isLineBlocked } from "@/features/checkout"
import { usePosScanner, focusScanner } from "./use-pos-scanner"
import { usePosShortcuts } from "./use-pos-shortcuts"
import { usePosCheckout } from "./use-pos-checkout"

export type PosMode = "sale" | "nasiya"

function useConsignTarget() {
  const [open, setOpen] = React.useState(false)
  const [imei, setImei] = React.useState("")
  const [price, setPrice] = React.useState("")
  const openFor = (device: DeviceDetailView) => {
    setImei(device.imei)
    setPrice(device.targetPrice ?? "")
    setOpen(true)
  }
  return { open, setOpen, imei, price, openFor }
}

export function usePosTerminal() {
  const { t } = useI18n()
  const { data: settings } = useSettings()
  const canViewCost = useAuthStore((s) => s.hasPermission("device.cost.view"))
  const me = useAuthStore((s) => s.user?.id)

  const [mode, setMode] = React.useState<PosMode>("sale")
  const [customerOpen, setCustomerOpen] = React.useState(false)

  const lines = useCartStore((s) => s.lines)
  const addLine = useCartStore((s) => s.addLine)
  const removeLastLine = useCartStore((s) => s.removeLastLine)
  const clearCart = useCartStore((s) => s.clear)
  const consign = useConsignTarget()

  const defaultWarranty = settings?.defaultWarrantyDays ?? 14
  const minMargin = Number(settings?.minMarginPercent ?? 0)
  const blocked = lines.length === 0 || lines.some((line) => isLineBlocked(line, canViewCost))

  const onInStock = (device: DeviceDetailView) => {
    if (mode === "nasiya") return consign.openFor(device)
    if (!addLine(device, { warrantyDays: defaultWarranty })) toast.error(t("pos.duplicateDevice"))
  }

  const scanner = usePosScanner(onInStock)
  const checkout = usePosCheckout(blocked, () => {
    clearCart()
    scanner.clear()
  })

  usePosShortcuts({
    onFocusScanner: focusScanner,
    onCheckout: checkout.handleCheckout,
    onClearScanner: scanner.clear,
    onRemoveLast: removeLastLine,
    onToggleCustomer: () => setCustomerOpen((v) => !v),
    onToggleMode: () => setMode((m) => (m === "sale" ? "nasiya" : "sale")),
  })

  React.useEffect(() => {
    focusScanner()
  }, [])

  return {
    mode,
    setMode,
    scanner,
    canViewCost,
    minMargin,
    me,
    blocked,
    customerOpen,
    setCustomerOpen,
    consign,
    ...checkout,
  }
}
