import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity",
        className
      )}
      {...props}
    />
  )
}

function DialogPopup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <DialogPrimitive.Popup
          className={cn(
            "relative w-full max-w-lg rounded-[16px] bg-white text-[#202020] p-6 sm:p-7 shadow-[var(--shadow-xl)] border border-[#e8e8e8] transition-all outline-none my-auto",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute top-5 right-5 size-8 rounded-full bg-[#f8f9fa] flex items-center justify-center text-[#646464] hover:bg-[#eeeeee] hover:text-[#202020] transition-colors outline-none cursor-pointer">
            <X className="size-4 stroke-[2.2]" />
            <span className="sr-only">Yopish</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </div>
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
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-[#e8e8e8]",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
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
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
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
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
