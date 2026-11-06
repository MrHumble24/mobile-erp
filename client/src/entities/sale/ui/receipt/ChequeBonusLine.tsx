import type { ReceiptBonusLine } from "../../lib/receipt-bonus"

export function ChequeBonusLine({ line }: { line: ReceiptBonusLine | null }) {
  if (!line) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 text-[10px]">
      <div className="flex justify-between items-center gap-2 min-w-0">
        <span className="min-w-0 truncate">{line.label}</span>
        <span className="font-mono shrink-0 whitespace-nowrap tabular-nums">{line.negative ? `− ${line.amount}` : line.amount}</span>
      </div>
    </div>
  )
}
