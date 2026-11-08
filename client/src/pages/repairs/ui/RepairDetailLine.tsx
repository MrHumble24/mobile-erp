import { cn } from "@/shared/lib/utils"

/** Label-left / value-right row used by every repair detail section. */
export function Line({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0 py-1 text-sm">
      <span className="text-muted-foreground min-w-0 truncate">{label}</span>
      <span className={cn("font-mono shrink-0 whitespace-nowrap tabular-nums", strong && "font-bold", danger && "text-destructive")}>{value}</span>
    </div>
  )
}
