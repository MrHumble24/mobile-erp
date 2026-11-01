import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface LabelProps extends React.ComponentProps<"label"> {
  optional?: boolean
}

function Label({ className, optional, children, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-xs font-body font-medium uppercase tracking-wider text-obsidian/75 select-none flex items-center justify-between",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {optional && (
        <span className="text-[11px] normal-case tracking-normal opacity-50 font-normal">
          (ixtiyoriy)
        </span>
      )}
    </label>
  )
}

export { Label }
