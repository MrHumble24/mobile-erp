import { CheckoutReceiptModal } from "@/features/checkout"
import { CatalogBrowser } from "@/features/catalog-sell"
import { ShiftBar } from "@/features/manage-shift"
import { ModeSwitch } from "./ModeSwitch"
import { InputModeSwitch } from "./InputModeSwitch"
import { ShortcutsHelp } from "./ShortcutsHelp"
import { PosScanner } from "./PosScanner"
import { ProductSearch } from "./ProductSearch"
import { SessionPanel } from "./SessionPanel"
import { NasiyaPanel } from "./NasiyaPanel"
import { CartBar } from "./CartBar"
import { CartColumn } from "./CartColumn"
import { usePosTerminal } from "../model/use-pos-terminal"

export function PosTerminal() {
  const pos = usePosTerminal()
  const catalogSale = pos.inputMode === "catalog" && pos.mode === "sale"

  return (
    <div className="space-y-5">
      {pos.shiftsEnabled && <ShiftBar />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ModeSwitch mode={pos.mode} onModeChange={pos.setMode} />
          <InputModeSwitch mode={pos.inputMode} onModeChange={pos.setInputMode} />
        </div>
        <ShortcutsHelp />
      </div>

      {catalogSale ? (
        // Grid on the left (own scroll), a pinned cart column on the right whose
        // lines scroll while totals + checkout stay in view (ADR 0034 fix).
        <div className="grid grid-cols-1 gap-5 lg:h-[calc(100vh-190px)] lg:grid-cols-[1fr_380px]">
          <div className="min-h-0 lg:overflow-y-auto lg:pr-1">
            <CatalogBrowser
              level={pos.priceLevelCode}
              excludeUnitIds={pos.excludeUnitIds}
              onPickUnit={pos.onPickUnit}
              onPickQuantity={pos.onPickQuantity}
            />
          </div>
          <aside className="min-h-0 lg:h-full">
            <CartColumn pos={pos} pinned />
          </aside>
          <CartBar pos={pos} />
        </div>
      ) : (
        <>
          <PosScanner scanner={pos.scanner} />
          {pos.mode === "sale" && <ProductSearch />}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              {pos.mode === "sale" ? (
                <CartColumn pos={pos} />
              ) : (
                <NasiyaPanel
                  open={pos.consign.open}
                  onOpenChange={pos.consign.setOpen}
                  initialImei={pos.consign.imei}
                  initialAgreedPrice={pos.consign.price}
                  partnerPriceUsed={pos.consign.partnerPrice}
                />
              )}
            </div>
            <SessionPanel soldById={pos.me} onOpenReceipt={(id) => pos.openReceipt([id])} />
          </div>
        </>
      )}

      <CheckoutReceiptModal
        saleIds={pos.saleIds}
        open={pos.receiptOpen}
        onOpenChange={pos.setReceiptOpen}
        onNewSale={pos.handleNewSale}
      />
    </div>
  )
}
