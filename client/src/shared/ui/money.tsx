import { cn } from "@/shared/lib/utils"
import { formatMoney, formatMoneyShort } from "@/shared/lib/format"
import { useFitText } from "@/shared/lib/hooks/use-fit-text"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

export interface MoneyProps {
  value: string | number | null | undefined
  /**
   * Headline numbers (metric cards, summary tiles, chart labels): shrink to fit
   * the box, then — only if the smallest readable size still overflows — fall
   * back to a short form with the exact figure in a tooltip. Default is the
   * plain exact figure, which must be used in tables, receipts, forms and
   * anything a cashier counts money from.
   */
  headline?: boolean
  className?: string
}

/** Exact money on one line with tabular digits. Never wraps, never shortens. */
export function Money({ value, headline, className }: MoneyProps) {
  if (headline) return <MoneyHeadline value={value} className={className} />
  return (
    <span className={cn("tabular-nums whitespace-nowrap", className)}>
      {formatMoney(value)}
    </span>
  )
}

function MoneyHeadline({ value, className }: Omit<MoneyProps, "headline">) {
  const full = formatMoney(value)
  const { containerRef, textRef, scale, overflow } = useFitText(full)

  return (
    <span ref={containerRef} className={cn("block overflow-hidden", className)}>
      {overflow ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="tabular-nums whitespace-nowrap cursor-help underline decoration-dotted underline-offset-4" />
              }
            >
              {formatMoneyShort(value)}
            </TooltipTrigger>
            <TooltipContent>{full}</TooltipContent>
          </Tooltip>
          <span
            ref={textRef}
            aria-hidden
            className="invisible absolute left-0 whitespace-nowrap tabular-nums"
          >
            {full}
          </span>
        </TooltipProvider>
      ) : (
        <span
          ref={textRef}
          className="inline-block origin-left whitespace-nowrap tabular-nums"
          style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
        >
          {full}
        </span>
      )}
    </span>
  )
}
