import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface SectionProps {
  title?: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  cardClassName?: string
}

/**
 * Apple Inset Grouped Section:
 * Renders an uppercase section heading, an inset rounded card with hairline dividers
 * between rows, and an optional footer description note.
 */
export function Section({
  title,
  description,
  footer,
  children,
  className,
  cardClassName,
}: SectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div className="px-1.5 space-y-0.5">
          <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs divide-y divide-border/60",
          cardClassName,
        )}
      >
        {children}
      </div>
      {footer && (
        <div className="px-2 text-xs text-muted-foreground leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  )
}
