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
      "bg-limestone text-obsidian border-[1.5px] border-obsidian/30 placeholder:text-obsidian/40 focus:border-obsidian focus:ring-4 focus:ring-ember/20",
    dark:
      "bg-transparent text-chalk border-[1.5px] border-chalk/80 placeholder:text-chalk/40 focus:border-ember focus:ring-4 focus:ring-ember/30",
  }[variant]

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full rounded-[100px] px-8 text-base font-body font-medium outline-none transition-all disabled:pointer-events-none disabled:opacity-40 shadow-none",
        variantStyles,
        className
      )}
      {...props}
    />
  )
}

export { Input }
