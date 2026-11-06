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
      "bg-background text-foreground border border-input placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20",
    dark:
      "bg-card text-card-foreground border border-border placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30",
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
