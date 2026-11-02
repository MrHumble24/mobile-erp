import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center font-display font-semibold select-none rounded-full transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[#eeeeee] text-[#202020] border-none shadow-none",
        mercury:
          "bg-[#eeeeee] text-[#646464] border-none shadow-none",
        mint:
          "bg-[#6ee7b7] text-[#090c1d] border-none shadow-none",
        blue:
          "bg-[#0091ff] text-white border-none shadow-none",
        violet:
          "bg-[#6647f0]/10 text-[#6647f0] border border-[#6647f0]/20 shadow-none",
        emerald:
          "bg-[#00c07a]/15 text-[#00c07a] border border-[#00c07a]/30 shadow-none",
        teal:
          "bg-[#16c0a4]/15 text-[#16c0a4] border border-[#16c0a4]/30 shadow-none",
        dark:
          "bg-[#202020] text-white border-none shadow-none",
        outline:
          "bg-transparent text-[#202020] border border-[#e8e8e8] shadow-none",
        destructive:
          "bg-rose-500/15 text-rose-600 border border-rose-500/20 shadow-none",
        // Legacy aliases
        sulfur:
          "bg-[#6ee7b7] text-[#090c1d] border-none shadow-none",
        ember:
          "bg-rose-500/15 text-rose-600 border border-rose-500/20 shadow-none",
        plasma:
          "bg-[#6647f0]/10 text-[#6647f0] border border-[#6647f0]/20 shadow-none",
        limestone:
          "bg-[#eeeeee] text-[#202020] border-none shadow-none",
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
