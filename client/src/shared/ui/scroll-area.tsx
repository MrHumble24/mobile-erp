import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { cn } from "@/shared/lib/utils"

export interface ScrollAreaProps
  extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {}

function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
        <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex touch-none select-none p-0.5 transition-colors duration-150 ease-out hover:bg-black/5 data-[orientation=vertical]:w-2.5"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-[800px] bg-obsidian/25 hover:bg-ember transition-colors" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        orientation="horizontal"
        className="flex touch-none select-none p-0.5 transition-colors duration-150 ease-out hover:bg-black/5 data-[orientation=horizontal]:h-2.5"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-[800px] bg-obsidian/25 hover:bg-ember transition-colors" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

export { ScrollArea }
