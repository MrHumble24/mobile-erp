import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center font-display font-semibold select-none rounded-full transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-foreground border-none shadow-none",
        mercury:
          "bg-muted text-muted-foreground border-none shadow-none",
        mint:
          "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-none shadow-none",
        blue:
          "bg-primary text-primary-foreground border-none shadow-none",
        amber:
          "bg-amber-500/15 text-amber-700 border border-amber-500/30 shadow-none",
        violet:
          "bg-primary/10 text-primary border border-primary/20 shadow-none",
        emerald:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-none",
        teal:
          "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-none",
        dark:
          "bg-primary text-primary-foreground border-none shadow-none",
        outline:
          "bg-transparent text-foreground border border-border shadow-none",
        destructive:
          "bg-rose-500/15 text-rose-600 border border-rose-500/20 shadow-none",
        // Legacy aliases
        sulfur:
          "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-none shadow-none",
        ember:
          "bg-rose-500/15 text-rose-600 border border-rose-500/20 shadow-none",
        plasma:
          "bg-primary/10 text-primary border border-primary/20 shadow-none",
        limestone:
          "bg-muted text-foreground border-none shadow-none",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2.5 py-0.5 text-[11px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
