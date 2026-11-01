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
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Positioner>) {
  return (
    <DropdownMenuPortal>
      <MenuPrimitive.Positioner sideOffset={sideOffset} {...props}>
        <MenuPrimitive.Popup
          className={cn(
            "z-50 min-w-56 overflow-hidden rounded-[24px] bg-limestone text-obsidian p-2 shadow-none border-[1.5px] border-obsidian/20 outline-none flex flex-col gap-1 transition-all",
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
        "relative flex cursor-pointer select-none items-center gap-3 rounded-[16px] px-4 py-2.5 text-sm font-body font-medium outline-none transition-colors",
        variant === "destructive"
          ? "text-ember hover:bg-ember/15"
          : "text-obsidian hover:bg-pumice focus:bg-pumice",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.GroupLabel>) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn(
        "px-4 py-2 text-xs font-body font-medium uppercase tracking-wider text-obsidian/60",
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
      className={cn("my-1 h-[1.5px] bg-obsidian/15", className)}
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
