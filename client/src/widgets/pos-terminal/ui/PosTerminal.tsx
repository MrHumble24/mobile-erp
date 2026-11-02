import { useI18n } from "@/shared/i18n"
import { DeviceCard, CheckoutReceiptModal } from "@/features/checkout"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { CheckoutParamsForm } from "./CheckoutParamsForm"
import { usePosTerminal } from "../model/use-pos-terminal"

function EmptyCartPlaceholder() {
  const { t } = useI18n()
  return (
    <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
      <p className="text-lg font-medium">{t("pos.cartEmpty")}</p>
      <p className="text-sm mt-1">{t("pos.scanPrompt")}</p>
    </div>
  )
}

function PosCheckoutSection({
  cart,
  onSubmit,
  isPending,
}: {
  cart: ReturnType<typeof usePosTerminal>["cart"]
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}) {
  if (!cart.device) return <EmptyCartPlaceholder />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DeviceCard device={cart.device} />
      <div className="p-6 border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
        <CheckoutParamsForm
          salePrice={cart.salePrice}
          onPriceChange={cart.setSalePrice}
          customer={cart.customer}
          onCustomerChange={cart.setCustomer}
          warrantyDays={cart.warrantyDays}
          onWarrantyChange={cart.setWarrantyDays}
          notes={cart.notes}
          onNotesChange={cart.setNotes}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  )
}

export function PosTerminal() {
  const { t } = useI18n()
  const {
    scannedImei,
    setScannedImei,
    handleScan,
    handleSubmit,
    handleNewSale,
    isPending,
    completedSaleId,
    receiptOpen,
    setReceiptOpen,
    cart,
  } = usePosTerminal()

  return (
    <div className="space-y-6">
      <div className="w-full max-w-xl">
        <BarcodeInput
          value={scannedImei}
          onChange={(e) => setScannedImei(e.target.value)}
          onScan={handleScan}
          onClear={() => setScannedImei("")}
          placeholder={t("pos.scanPrompt")}
          className="h-12 text-base"
        />
      </div>
      <PosCheckoutSection cart={cart} onSubmit={handleSubmit} isPending={isPending} />
      <CheckoutReceiptModal
        saleId={completedSaleId}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        onNewSale={handleNewSale}
      />
    </div>
  )
}
