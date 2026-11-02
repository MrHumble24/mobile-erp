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
        "text-xs font-body font-semibold text-[#646464] select-none flex items-center justify-between",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {optional && (
        <span className="text-[11px] font-normal text-[#838383]">
          (ixtiyoriy)
        </span>
      )}
    </label>
  )
}

export { Label }
