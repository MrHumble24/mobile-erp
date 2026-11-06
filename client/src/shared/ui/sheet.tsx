import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

function Sheet({
  swipeDirection = "down",
  // Open fully: a 65% "peek" snap point hides the bottom third (and its Save buttons) on desktop.
  snapPoints = [1],
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      swipeDirection={swipeDirection}
      snapPoints={snapPoints}
      {...props}
    />
  )
}

const SheetTrigger = DrawerPrimitive.Trigger
const SheetClose = DrawerPrimitive.Close
const SheetPortal = DrawerPrimitive.Portal
const SheetViewport = DrawerPrimitive.Viewport

function SheetBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/35 backdrop-blur-xl backdrop-saturate-200 bottomsheet-backdrop",
        className
      )}
      {...props}
    />
  )
}

export interface SheetPopupProps
  extends React.ComponentProps<typeof DrawerPrimitive.Popup> {
  side?: "right" | "left" | "bottom"
  showHandle?: boolean
  showClose?: boolean
  contentClassName?: string
}

function SheetPopup({
  side: _side,
  className,
  children,
  showHandle = true,
  showClose = true,
  contentClassName,
  ...props
}: SheetPopupProps) {
  return (
    <SheetPortal>
      <SheetBackdrop />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:p-4">
        <DrawerPrimitive.Popup
          className={cn(
            "relative z-50 flex flex-col bg-card text-foreground shadow-[var(--shadow-xl)] border border-border outline-none overscroll-contain",
            "w-full rounded-t-[24px] max-h-[92vh]",
            "sm:max-w-3xl sm:rounded-[24px]",
            "bottomsheet-popup",
            className
          )}
          {...props}
        >
          {showHandle && (
            <div
              className="pt-3 pb-2 flex justify-center shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
              aria-label="Drag handle"
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors pointer-events-none" />
            </div>
          )}
          {showClose && (
            <DrawerPrimitive.Close className="absolute top-3.5 right-4 size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors outline-none cursor-pointer z-10">
              <X className="size-4 stroke-[2.2]" />
              <span className="sr-only">Yopish</span>
            </DrawerPrimitive.Close>
          )}
          <DrawerPrimitive.Content
            className={cn(
              "overflow-y-auto overscroll-contain flex-1 px-5 sm:px-7 pb-7 pt-1 outline-none",
              contentClassName
            )}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 pb-4 border-b border-border", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-6", className)}
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
        "font-display text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug",
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
        "font-body text-sm font-normal text-muted-foreground leading-normal",
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
  SheetViewport,
  SheetBackdrop,
  SheetPopup,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
