import { PosTerminal } from "@/widgets/pos-terminal"

/**
 * The till is rendered chrome-free (see AppShell) and owns the full viewport.
 * All header tools, mode switches and the focused credit step live inside the
 * terminal so the page itself stays a single, distraction-free surface.
 */
export function PosPage() {
  return (
    <div className="h-full w-full">
      <PosTerminal />
    </div>
  )
}
