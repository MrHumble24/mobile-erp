import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/shared/lib/utils"

const DropdownMenu = MenuPrimitive.Root
const DropdownMenuTrigger = MenuPrimitive.Trigger
const DropdownMenuGroup = MenuPrimitive.Group
const DropdownMenuPortal = MenuPrimitive.Portal
const DropdownMenuSub = MenuPrimitive.SubmenuRoot
const DropdownMenuSubTrigger = MenuPrimitive.SubmenuTrigger

function DropdownMenuContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Positioner>) {
  return (
    <DropdownMenuPortal>
      <MenuPrimitive.Positioner sideOffset={sideOffset} className="z-[100] outline-none" {...props}>
        <MenuPrimitive.Popup
          className={cn(
            "z-[100] min-w-52 overflow-hidden rounded-[12px] bg-white text-[#202020] p-1 shadow-[var(--shadow-subtle-2)] border border-[#e8e8e8] outline-none flex flex-col gap-0.5 transition-all",
            className
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </DropdownMenuPortal>
  )
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-body outline-none transition-colors",
        variant === "destructive"
          ? "text-[#e53935] hover:bg-rose-50 focus:bg-rose-50"
          : "text-[#202020] hover:bg-[#f8f9fa] focus:bg-[#f8f9fa]",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-[11px] font-body font-semibold uppercase tracking-wider text-[#838383]",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      className={cn("my-1 h-[1px] bg-[#e8e8e8]", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
}
