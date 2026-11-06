import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  variant?: "light" | "dark"
}

function Textarea({
  className,
  variant = "light",
  ...props
}: TextareaProps) {
  const variantStyles = {
    light:
      "bg-background text-foreground border border-input placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20",
    dark:
      "bg-card text-card-foreground border border-border placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30",
  }[variant]

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-[9px] p-3 text-sm font-body outline-none transition-all disabled:pointer-events-none disabled:opacity-40 shadow-none resize-y",
        variantStyles,
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
