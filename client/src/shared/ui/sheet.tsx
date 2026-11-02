import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const Sheet = DrawerPrimitive.Root
const SheetTrigger = DrawerPrimitive.Trigger
const SheetClose = DrawerPrimitive.Close
const SheetPortal = DrawerPrimitive.Portal

function SheetBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity",
        className
      )}
      {...props}
    />
  )
}

export interface SheetPopupProps
  extends React.ComponentProps<typeof DrawerPrimitive.Popup> {
  side?: "right" | "left" | "bottom"
}

function SheetPopup({
  side = "right",
  className,
  children,
  ...props
}: SheetPopupProps) {
  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-full max-w-lg border-l border-[#e8e8e8]",
    left: "inset-y-0 left-0 h-full w-full max-w-lg border-r border-[#e8e8e8]",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t border-[#e8e8e8] rounded-t-[16px]",
  }[side]

  return (
    <SheetPortal>
      <SheetBackdrop />
      <DrawerPrimitive.Popup
        className={cn(
          "fixed z-50 bg-white text-[#202020] p-6 sm:p-7 shadow-[var(--shadow-xl)] outline-none overflow-y-auto flex flex-col justify-between transition-transform duration-300",
          sideClasses,
          className
        )}
        {...props}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-1 rounded-full bg-[#d4d4d4] mx-auto sm:hidden" />
          </div>
          {children}
        </div>
        <DrawerPrimitive.Close className="absolute top-5 right-5 size-8 rounded-full bg-[#f8f9fa] flex items-center justify-center text-[#646464] hover:bg-[#eeeeee] hover:text-[#202020] transition-colors outline-none cursor-pointer">
          <X className="size-4 stroke-[2.2]" />
          <span className="sr-only">Yopish</span>
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 pb-4 border-b border-[#e8e8e8]", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-[#e8e8e8] mt-6", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn(
        "font-display text-lg sm:text-xl font-bold text-[#090c1d] tracking-tight leading-snug",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn(
        "font-body text-sm font-normal text-[#646464] leading-normal",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetBackdrop,
  SheetPopup,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
