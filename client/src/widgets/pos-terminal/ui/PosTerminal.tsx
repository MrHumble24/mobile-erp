import * as React from "react"
import { ShiftBar } from "@/features/manage-shift"
import { PosTopBar } from "./PosTopBar"
import { PosWorkPane } from "./PosWorkPane"
import { PosTillPane } from "./PosTillPane"
import { PosScanner } from "./PosScanner"
import { NasiyaPanel } from "./NasiyaPanel"
import { CartBar } from "./CartBar"
import { usePosTerminal } from "../model/use-pos-terminal"
import { useFullscreen } from "../model/use-fullscreen"

/** Partner consignment keeps its own, deliberately quiet canvas. */
function NasiyaView({ pos }: { pos: ReturnType<typeof usePosTerminal> }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="shrink-0 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <PosScanner scanner={pos.scanner} />
      </div>
      <NasiyaPanel
        open={pos.consign.open}
        onOpenChange={pos.consign.setOpen}
        initialImei={pos.consign.imei}
        initialAgreedPrice={pos.consign.price}
        partnerPriceUsed={pos.consign.partnerPrice}
      />
    </section>
  )
}

/**
 * The till fills the whole viewport: one slim bar, a bounded work area and a
 * checkout column whose totals never leave the screen. Nothing here scrolls the
 * page. Selling on credit navigates to the dedicated /pos/credit page.
 */
export function PosTerminal() {
  const pos = usePosTerminal()
  const fullscreen = useFullscreen()

  // Navigating away must not leave the browser stuck in kiosk fullscreen.
  const { exit: exitFullscreen } = fullscreen
  React.useEffect(() => {
    return () => {
      void exitFullscreen()
    }
  }, [exitFullscreen])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted">
      {pos.shiftsEnabled && (
        <div className="shrink-0 px-3 pt-3 sm:px-4">
          <ShiftBar />
        </div>
      )}

      <PosTopBar pos={pos} fullscreen={fullscreen} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 pb-20 sm:p-4 lg:flex-row lg:gap-4 lg:overflow-hidden lg:pb-4">
        {pos.mode === "nasiya" ? (
          <NasiyaView pos={pos} />
        ) : (
          <>
            <PosWorkPane pos={pos} />
            <PosTillPane pos={pos} />
          </>
        )}
      </div>

      <CartBar pos={pos} />
    </div>
  )
}
