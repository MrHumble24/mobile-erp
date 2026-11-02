import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/shared/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close

function PopoverContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Positioner>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={sideOffset} {...props}>
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 w-72 rounded-[12px] bg-white p-4 text-[#202020] shadow-[var(--shadow-subtle-2)] border border-[#e8e8e8] outline-none flex flex-col gap-2.5 transition-all",
            className
          )}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverClose }
