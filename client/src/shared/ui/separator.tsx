import * as React from "react"
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/shared/lib/utils"

export interface SeparatorProps
  extends React.ComponentProps<typeof SeparatorPrimitive> {
  variant?: "solid" | "dotted"
}

function Separator({
  className,
  orientation = "horizontal",
  variant: _variant,
  ...props
}: SeparatorProps) {
  const isHorizontal = orientation === "horizontal"

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-[#e8e8e8]",
        isHorizontal ? "h-[1px] w-full" : "w-[1px] h-full",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
