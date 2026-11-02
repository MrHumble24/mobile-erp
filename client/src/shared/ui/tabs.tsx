import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/shared/lib/utils"

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#f8f9fa] p-1 border border-[#e8e8e8]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-display font-semibold transition-all outline-none cursor-pointer select-none text-[#646464] hover:text-[#202020] data-[active]:bg-[#202020] data-[active]:text-white data-[active]:shadow-none disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      className={cn(
        "mt-5 outline-none transition-all",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
