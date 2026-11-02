import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { Dialog, DialogPopup } from "@/shared/ui/dialog"
import { cn } from "@/shared/lib/utils"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-[12px] bg-white text-[#202020]",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  children,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Dialog> & { children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogPopup className="overflow-hidden p-0 max-w-xl">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#838383] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:size-4 [&_[cmdk-input]]:h-11">
          {children}
        </Command>
      </DialogPopup>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center px-4 border-b border-[#e8e8e8]">
      <Search className="mr-2.5 size-4 shrink-0 stroke-[2] text-[#838383]" />
      <CommandPrimitive.Input
        className={cn(
          "flex h-11 w-full bg-transparent py-2.5 text-sm font-body outline-none placeholder:text-[#838383] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-72 overflow-y-auto overflow-x-hidden p-2", className)}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-xs font-body text-[#838383]"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-[#202020] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#838383] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-[1px] bg-[#e8e8e8]", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-body outline-none transition-colors aria-selected:bg-[#f8f9fa] aria-selected:text-[#202020] data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-[#838383] font-mono",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
