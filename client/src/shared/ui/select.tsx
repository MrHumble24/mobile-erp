import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-14 w-full items-center justify-between rounded-[100px] bg-limestone px-8 text-base font-body font-medium text-obsidian border-[1.5px] border-obsidian/30 outline-none transition-all focus:border-obsidian focus:ring-4 focus:ring-ember/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-none",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-5 stroke-[2] opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Positioner>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={sideOffset} {...props}>
        <SelectPrimitive.Popup
          className={cn(
            "z-50 min-w-48 overflow-hidden rounded-[24px] bg-limestone text-obsidian p-2 border-[1.5px] border-obsidian/20 outline-none shadow-none flex flex-col gap-1 transition-all",
            className
          )}
        >
          <SelectPrimitive.List className="outline-none flex flex-col gap-1">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center justify-between rounded-[16px] px-4 py-3 text-sm font-body font-medium text-obsidian outline-none transition-colors hover:bg-pumice focus:bg-pumice data-[selected]:bg-ember/15 data-[selected]:font-semibold disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 stroke-[2.5] text-ember" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.GroupLabel>) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn(
        "px-4 py-2 text-xs font-body font-medium uppercase tracking-wider text-obsidian/60",
        className
      )}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn("my-1 h-[1.5px] bg-obsidian/15", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
