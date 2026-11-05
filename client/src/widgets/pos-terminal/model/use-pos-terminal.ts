import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { unitCode } from "@/shared/lib/unit-code"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import type { DeviceDetailView } from "@/entities/device"
import type { StockScanProduct } from "@/entities/stock"
import type { CatalogEntry, CatalogUnit } from "@/entities/catalog"
import { useCartStore, isLineBlocked, isPaymentBlocked, toLinePrices } from "@/features/checkout"
import { usePosScanner, focusScanner } from "./use-pos-scanner"
import { usePosShortcuts } from "./use-pos-shortcuts"
import { usePosCheckout } from "./use-pos-checkout"
import { usePosPrefsStore } from "./pos-prefs.store"
import { catalogUnitToDevice, catalogEntryToProduct } from "../lib/catalog-cart"

export type PosMode = "sale" | "nasiya"

function useConsignTarget() {
  const [open, setOpen] = React.useState(false)
  const [imei, setImei] = React.useState("")
  const [price, setPrice] = React.useState("")
  const openFor = (device: DeviceDetailView) => {
    setImei(unitCode(device))
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
  const inputMode = usePosPrefsStore((s) => s.inputMode)
  const setInputMode = usePosPrefsStore((s) => s.setInputMode)

  const lines = useCartStore((s) => s.lines)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const splitParts = useCartStore((s) => s.splitParts)
  const addLine = useCartStore((s) => s.addLine)
  const addProduct = useCartStore((s) => s.addProduct)
  const removeLastLine = useCartStore((s) => s.removeLastLine)
  const clearCart = useCartStore((s) => s.clear)
  const consign = useConsignTarget()

  const defaultWarranty = settings?.defaultWarrantyDays ?? 14
  const minMargin = Number(settings?.minMarginPercent ?? 0)
  const blocked =
    lines.length === 0 ||
    lines.some((line) => isLineBlocked(line, canViewCost)) ||
    isPaymentBlocked(toLinePrices(lines), paymentMethod, splitParts)

  const onInStock = (device: DeviceDetailView) => {
    if (mode === "nasiya") return consign.openFor(device)
    if (!addLine(device, { warrantyDays: defaultWarranty })) toast.error(t("pos.duplicateDevice"))
  }

  const onProduct = (product: StockScanProduct) => {
    // Accessories are a retail sale only; in nasiya mode ignore a product scan.
    if (mode === "nasiya") return
    addProduct(product)
  }

  // Units already in the cart are never offered again in catalog mode.
  const excludeUnitIds = React.useMemo(
    () => new Set(lines.filter((l) => l.kind === "unit").map((l) => l.device.id)),
    [lines]
  )
  const onPickUnit = (unit: CatalogUnit, entry: CatalogEntry) =>
    onInStock(catalogUnitToDevice(entry, unit))
  const onPickQuantity = (entry: CatalogEntry) => onProduct(catalogEntryToProduct(entry))

  const scanner = usePosScanner(onInStock, onProduct)
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
    inputMode,
    setInputMode,
    scanner,
    excludeUnitIds,
    onPickUnit,
    onPickQuantity,
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
