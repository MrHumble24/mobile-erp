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
      "bg-limestone text-obsidian border-[1.5px] border-obsidian/30 placeholder:text-obsidian/40 focus:border-obsidian focus:ring-4 focus:ring-ember/20",
    dark:
      "bg-transparent text-chalk border-[1.5px] border-chalk/80 placeholder:text-chalk/40 focus:border-ember focus:ring-4 focus:ring-ember/30",
  }[variant]

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-32 w-full rounded-[24px] p-6 text-base font-body font-medium outline-none transition-all disabled:pointer-events-none disabled:opacity-40 shadow-none resize-y",
        variantStyles,
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
