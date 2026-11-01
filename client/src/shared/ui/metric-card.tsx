import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface MetricCardProps extends React.ComponentProps<"div"> {
  value: React.ReactNode
  label: React.ReactNode
  subtext?: React.ReactNode
  variant?: "ember" | "limestone" | "plasma" | "dark"
}

function MetricCard({
  value,
  label,
  subtext,
  variant = "ember",
  className,
  ...props
}: MetricCardProps) {
  const variantStyles = {
    ember: "bg-ember text-chalk",
    limestone: "bg-limestone text-obsidian",
    plasma: "caldera-halftone text-chalk",
    dark: "bg-obsidian text-chalk",
  }[variant]

  return (
    <div
      data-slot="metric-card"
      className={cn(
        "rounded-[40px] p-8 md:p-10 flex flex-col justify-between min-h-[200px] shadow-none transition-all",
        variantStyles,
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <span className="font-body text-xs md:text-sm font-medium opacity-90 uppercase tracking-widest block">
          {label}
        </span>
        {subtext && (
          <span className="font-body text-xs opacity-60 block">
            {subtext}
          </span>
        )}
      </div>
      <div className="font-display text-5xl md:text-6xl lg:text-7xl leading-none tracking-[0.02em] pt-4">
        {value}
      </div>
    </div>
  )
}

export { MetricCard }
