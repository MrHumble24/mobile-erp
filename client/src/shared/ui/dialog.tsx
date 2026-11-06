import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

function Dialog({
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
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-xl backdrop-saturate-200 bottomsheet-backdrop",
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
            "relative z-50 flex flex-col bg-card text-foreground shadow-[var(--shadow-xl)] border border-border outline-none overscroll-contain",
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
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-border mt-2",
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
        "font-display text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug",
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
        "font-body text-sm font-normal text-muted-foreground leading-normal",
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
