import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { useFitText } from "@/shared/lib/hooks/use-fit-text"

export interface MetricCardProps extends React.ComponentProps<"div"> {
  value: React.ReactNode
  label: React.ReactNode
  subtext?: React.ReactNode
  variant?: "ember" | "limestone" | "plasma" | "dark" | "white"
}

function MetricCardHeader({
  label,
  subtext,
  isDark,
}: {
  label: React.ReactNode
  subtext?: React.ReactNode
  isDark: boolean
}) {
  return (
    <div className="space-y-1">
      <span
        className={cn(
          "font-body text-xs font-semibold uppercase tracking-wider block",
          "text-muted-foreground"
        )}
      >
        {label}
      </span>
      {subtext && (
        <span
          className={cn(
            "font-body text-xs block",
            isDark ? "text-muted-foreground" : "text-muted-foreground"
          )}
        >
          {subtext}
        </span>
      )}
    </div>
  )
}

/** Big headline number that shrinks to fit one line instead of overflowing. */
function MetricValue({
  isDark,
  children,
}: {
  isDark: boolean
  children: React.ReactNode
}) {
  const content = children
  const dep = typeof content === "string" || typeof content === "number" ? content : 0
  // 0.4 floor keeps the full 13-digit stress figure ($9,999,999,999.99) legible
  // and uncut even in the narrowest 2-column card (~120px) at phone width.
  const { containerRef, textRef, scale } = useFitText(dep, 0.4)
  return (
    <span
      ref={containerRef}
      className={cn(
        "font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight pt-3 block overflow-hidden",
        isDark ? "text-white" : "text-foreground"
      )}
    >
      <span
        ref={textRef}
        className="inline-block origin-left whitespace-nowrap tabular-nums"
        style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
      >
        {content}
      </span>
    </span>
  )
}

function MetricCard({
  value,
  label,
  subtext,
  variant = "white",
  className,
  ...props
}: MetricCardProps) {
  const isDark = variant === "dark"

  return (
    <div
      data-slot="metric-card"
      className={cn(
        "rounded-[16px] p-6 flex flex-col justify-between min-h-[140px] shadow-[var(--shadow-xs)] transition-all",
        isDark
          ? "bg-card text-card-foreground border border-border"
          : "bg-card text-foreground border border-border",
        className
      )}
      {...props}
    >
      <MetricCardHeader label={label} subtext={subtext} isDark={isDark} />
      <MetricValue isDark={isDark}>{value}</MetricValue>
    </div>
  )
}

export { MetricCard }
