import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

function Dialog({
  swipeDirection = "down",
  snapPoints = [0.65, 1],
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

const DialogTrigger = DrawerPrimitive.Trigger
const DialogPortal = DrawerPrimitive.Portal
const DialogClose = DrawerPrimitive.Close
const DialogViewport = DrawerPrimitive.Viewport

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs bottomsheet-backdrop",
        className
      )}
      {...props}
    />
  )
}

export interface DialogPopupProps
  extends React.ComponentProps<typeof DrawerPrimitive.Popup> {
  showHandle?: boolean
  showClose?: boolean
  contentClassName?: string
}

function DialogPopup({
  className,
  children,
  showHandle = true,
  showClose = true,
  contentClassName,
  ...props
}: DialogPopupProps) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:p-4">
        <DrawerPrimitive.Popup
          className={cn(
            "relative z-50 flex flex-col bg-white text-[#202020] shadow-[var(--shadow-xl)] border border-[#e8e8e8] outline-none overscroll-contain",
            "w-full rounded-t-[24px] max-h-[88vh]",
            "sm:max-w-xl sm:rounded-[24px]",
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
              <div className="w-12 h-1.5 rounded-full bg-[#d4d4d4] hover:bg-[#b0b0b0] transition-colors pointer-events-none" />
            </div>
          )}
          {showClose && (
            <DrawerPrimitive.Close className="absolute top-3.5 right-4 size-8 rounded-full bg-[#f8f9fa] flex items-center justify-center text-[#646464] hover:bg-[#eeeeee] hover:text-[#202020] transition-colors outline-none cursor-pointer z-10">
              <X className="size-4 stroke-[2.2]" />
              <span className="sr-only">Yopish</span>
            </DrawerPrimitive.Close>
          )}
          <DrawerPrimitive.Content
            className={cn(
              "overflow-y-auto overscroll-contain flex-1 px-5 sm:px-6 pb-6 pt-1 outline-none",
              contentClassName
            )}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 pb-4 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-[#e8e8e8] mt-2",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
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

function DialogDescription({
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
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogViewport,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
