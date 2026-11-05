import {
  CartLines,
  CustomerPanel,
  TotalsPanel,
  CheckoutReceiptModal,
} from "@/features/checkout"
import { CatalogBrowser } from "@/features/catalog-sell"
import { ModeSwitch } from "./ModeSwitch"
import { InputModeSwitch } from "./InputModeSwitch"
import { ShortcutsHelp } from "./ShortcutsHelp"
import { PosScanner } from "./PosScanner"
import { ProductSearch } from "./ProductSearch"
import { SessionPanel } from "./SessionPanel"
import { NasiyaPanel } from "./NasiyaPanel"
import { usePosTerminal } from "../model/use-pos-terminal"

function SaleWorkspace({ pos }: { pos: ReturnType<typeof usePosTerminal> }) {
  return (
    <div className="space-y-4">
      <CartLines canViewCost={pos.canViewCost} minMarginPercent={pos.minMargin} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)]">
          <CustomerPanel searchOpen={pos.customerOpen} onSearchOpenChange={pos.setCustomerOpen} />
        </div>
        <TotalsPanel isPending={pos.isPending} disabled={pos.blocked} onCheckout={pos.handleCheckout} />
      </div>
    </div>
  )
}

export function PosTerminal() {
  const pos = usePosTerminal()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ModeSwitch mode={pos.mode} onModeChange={pos.setMode} />
          <InputModeSwitch mode={pos.inputMode} onModeChange={pos.setInputMode} />
        </div>
        <ShortcutsHelp />
      </div>

      {pos.inputMode === "catalog" ? (
        <CatalogBrowser
          excludeUnitIds={pos.excludeUnitIds}
          onPickUnit={pos.onPickUnit}
          onPickQuantity={pos.onPickQuantity}
        />
      ) : (
        <>
          <PosScanner scanner={pos.scanner} />
          {pos.mode === "sale" && <ProductSearch />}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {pos.mode === "sale" ? (
            <SaleWorkspace pos={pos} />
          ) : (
            <NasiyaPanel
              open={pos.consign.open}
              onOpenChange={pos.consign.setOpen}
              initialImei={pos.consign.imei}
              initialAgreedPrice={pos.consign.price}
            />
          )}
        </div>
        <SessionPanel soldById={pos.me} onOpenReceipt={(id) => pos.openReceipt([id])} />
      </div>

      <CheckoutReceiptModal
        saleIds={pos.saleIds}
        open={pos.receiptOpen}
        onOpenChange={pos.setReceiptOpen}
        onNewSale={pos.handleNewSale}
      />
    </div>
  )
}
