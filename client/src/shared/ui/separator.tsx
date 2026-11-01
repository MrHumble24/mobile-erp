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
  variant = "dotted",
  ...props
}: SeparatorProps) {
  const isHorizontal = orientation === "horizontal"

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0",
        isHorizontal ? "w-full" : "h-full",
        variant === "dotted"
          ? isHorizontal
            ? "divider-dotted-h"
            : "divider-dotted-v"
          : isHorizontal
            ? "h-[1.5px] bg-obsidian/20"
            : "w-[1.5px] bg-obsidian/20",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
