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
        "fixed inset-0 z-50 bg-obsidian/60 backdrop-blur-sm transition-opacity",
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
    right: "inset-y-0 right-0 h-full w-full max-w-lg rounded-l-[40px]",
    left: "inset-y-0 left-0 h-full w-full max-w-lg rounded-r-[40px]",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-[40px]",
  }[side]

  return (
    <SheetPortal>
      <SheetBackdrop />
      <DrawerPrimitive.Popup
        className={cn(
          "fixed z-50 bg-limestone text-obsidian p-8 sm:p-10 shadow-none border-none outline-none overflow-y-auto flex flex-col justify-between transition-transform duration-300",
          sideClasses,
          className
        )}
        {...props}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-1.5 rounded-[800px] bg-obsidian/20 mx-auto sm:hidden" />
          </div>
          {children}
        </div>
        <DrawerPrimitive.Close className="absolute top-8 right-8 size-10 rounded-[800px] bg-pumice flex items-center justify-center text-obsidian hover:bg-ember hover:text-obsidian transition-colors outline-none cursor-pointer">
          <X className="size-5 stroke-[2.5]" />
          <span className="sr-only">Yopish</span>
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 pb-6 border-b border-dotted border-obsidian/25", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-dotted border-obsidian/25 mt-6", className)}
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
        "font-display text-2xl sm:text-3xl text-obsidian tracking-[0.02em] uppercase leading-none",
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
        "font-body text-sm font-medium text-obsidian/75 leading-relaxed",
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
