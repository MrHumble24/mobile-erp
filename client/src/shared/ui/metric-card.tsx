import * as React from "react"
import { cn } from "@/shared/lib/utils"

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
          isDark ? "text-[#b3b3b3]" : "text-[#838383]"
        )}
      >
        {label}
      </span>
      {subtext && (
        <span
          className={cn(
            "font-body text-xs block",
            isDark ? "text-[#838383]" : "text-[#646464]"
          )}
        >
          {subtext}
        </span>
      )}
    </div>
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
        "rounded-[12px] p-6 flex flex-col justify-between min-h-[140px] shadow-none transition-all",
        isDark
          ? "bg-[#111111] text-white border border-[#2a2a2a]"
          : "bg-white text-[#202020] border border-[#e8e8e8]",
        className
      )}
      {...props}
    >
      <MetricCardHeader label={label} subtext={subtext} isDark={isDark} />
      <div
        className={cn(
          "font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight pt-3",
          isDark ? "text-white" : "text-[#090c1d]"
        )}
      >
        {value}
      </div>
    </div>
  )
}

export { MetricCard }
