import {
  CartLines,
  CustomerPanel,
  PriceLevelControl,
  CartDiscountControl,
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
import { CartBar } from "./CartBar"
import { usePosTerminal } from "../model/use-pos-terminal"

type Pos = ReturnType<typeof usePosTerminal>

/** The cart column: lines, level + customer, a whole-cart discount, totals + checkout. */
function CartColumn({ pos }: { pos: Pos }) {
  return (
    <div id="pos-cart" className="space-y-4">
      <CartLines
        canViewCost={pos.canViewCost}
        minMarginPercent={pos.minMargin}
        canOverridePrice={pos.canOverridePrice}
        canDiscountUnlimited={pos.canDiscountUnlimited}
      />
      <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)] space-y-3">
        <PriceLevelControl />
        <CustomerPanel searchOpen={pos.customerOpen} onSearchOpenChange={pos.setCustomerOpen} />
      </div>
      <CartDiscountControl canDiscountUnlimited={pos.canDiscountUnlimited} />
      <TotalsPanel isPending={pos.isPending} disabled={pos.blocked} onCheckout={pos.handleCheckout} />
    </div>
  )
}

export function PosTerminal() {
  const pos = usePosTerminal()
  const catalogSale = pos.inputMode === "catalog" && pos.mode === "sale"

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ModeSwitch mode={pos.mode} onModeChange={pos.setMode} />
          <InputModeSwitch mode={pos.inputMode} onModeChange={pos.setInputMode} />
        </div>
        <ShortcutsHelp />
      </div>

      {catalogSale ? (
        // Grid on the left, a cart column on the right that stays in view (ADR 0034 fix).
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
          <CatalogBrowser
            level={pos.priceLevelCode}
            excludeUnitIds={pos.excludeUnitIds}
            onPickUnit={pos.onPickUnit}
            onPickQuantity={pos.onPickQuantity}
          />
          <aside className="lg:sticky lg:top-4">
            <CartColumn pos={pos} />
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
