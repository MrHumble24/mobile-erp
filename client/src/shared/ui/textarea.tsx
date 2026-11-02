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
      "bg-white text-[#202020] border border-[#d4d4d4] placeholder:text-[#838383] focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/20",
    dark:
      "bg-[#111111] text-white border border-[#2a2a2a] placeholder:text-[#838383] focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/30",
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
