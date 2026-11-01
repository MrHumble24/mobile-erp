import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center font-body font-medium select-none uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-sulfur text-obsidian rounded-[800px] border-none shadow-none",
        sulfur:
          "bg-sulfur text-obsidian rounded-[800px] border-none shadow-none",
        ember:
          "bg-ember text-obsidian rounded-[800px] border-none shadow-none",
        limestone:
          "bg-limestone text-obsidian rounded-[800px] border-[1.5px] border-obsidian/20 shadow-none",
        outline:
          "bg-transparent text-obsidian border-[1.5px] border-obsidian rounded-[800px] shadow-none",
        dark:
          "bg-obsidian text-chalk rounded-[800px] border-none shadow-none",
        plasma:
          "bg-plasma-violet text-chalk rounded-[800px] border-none shadow-none",
      },
      size: {
        default: "px-5 py-2 text-xs",
        sm: "px-3.5 py-1.5 text-[11px]",
        lg: "px-6 py-2.5 text-sm",
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
