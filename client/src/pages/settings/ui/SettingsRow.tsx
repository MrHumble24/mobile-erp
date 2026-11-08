import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface SettingsRowProps {
  label: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconBg?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Apple Inset Grouped Item Row:
 * Left side: Optional icon + title + subtitle
 * Right side: Control (Switch, Button, Input, Badge)
 */
export function SettingsRow({
  label,
  description,
  children,
  icon: Icon,
  iconBg,
  onClick,
  disabled,
  className,
}: SettingsRowProps) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-3.5 sm:px-4 sm:py-3 transition-colors",
        onClick && !disabled && "cursor-pointer hover:bg-muted/30 active:bg-muted/50",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {Icon && (
          <div
            className={cn(
              "size-7 rounded-lg flex items-center justify-center shrink-0 border border-border/70",
              iconBg || "bg-muted/50 text-foreground",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
          </div>
        )}
        <div className="space-y-0.5 min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground leading-normal">
              {description}
            </div>
          )}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left outline-none focus-visible:bg-muted/40"
      >
        {content}
      </button>
    )
  }

  return content
}
