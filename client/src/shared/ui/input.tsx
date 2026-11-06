import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "light" | "dark"
}

function Input({
  className,
  type,
  variant = "light",
  ...props
}: InputProps) {
  const variantStyles = {
    light:
      "bg-white text-foreground border border-[#d4d4d4] placeholder:text-muted-foreground focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/20",
    dark:
      "bg-[#111111] text-white border border-[#2a2a2a] placeholder:text-muted-foreground focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/30",
  }[variant]

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-[9px] px-3.5 text-sm font-body outline-none transition-all disabled:pointer-events-none disabled:opacity-40 shadow-none",
        variantStyles,
        className
      )}
      {...props}
    />
  )
}

export { Input }
