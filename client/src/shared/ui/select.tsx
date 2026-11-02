import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"

/** Walks the JSX tree for SelectItem elements so Base UI can render the selected label instead of the raw value. */
function collectItemLabels(children: React.ReactNode, acc: Record<string, React.ReactNode>) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as { value?: string; children?: React.ReactNode }
    if (child.type === SelectItem && props.value != null) {
      acc[props.value] = props.children
      return
    }
    if (props.children) collectItemLabels(props.children, acc)
  })
}

function Select<Value, Multiple extends boolean | undefined = false>({
  items,
  children,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const derivedItems = React.useMemo(() => {
    if (items) return items
    const acc: Record<string, React.ReactNode> = {}
    collectItemLabels(children, acc)
    return acc
  }, [items, children])
  return (
    <SelectPrimitive.Root<Value, Multiple> items={derivedItems} {...props}>
      {children}
    </SelectPrimitive.Root>
  )
}
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
        "flex h-10 w-full items-center justify-between rounded-[9px] bg-white px-3.5 text-sm font-body text-[#202020] border border-[#d4d4d4] outline-none transition-all focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-none",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 stroke-[2] text-[#838383]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Positioner>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        className="z-[100] outline-none"
        {...props}
      >
        <SelectPrimitive.Popup
          className={cn(
            "z-[100] min-w-44 overflow-hidden rounded-[12px] bg-white text-[#202020] p-1 border border-[#e8e8e8] outline-none shadow-[var(--shadow-subtle-2)] flex flex-col gap-0.5 transition-all",
            className
          )}
        >
          <SelectPrimitive.List className="outline-none flex flex-col gap-0.5">
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
        "relative flex cursor-pointer select-none items-center justify-between rounded-[8px] px-3 py-2 text-sm font-body text-[#202020] outline-none transition-colors hover:bg-[#f8f9fa] focus:bg-[#f8f9fa] data-[selected]:bg-[#0091ff]/10 data-[selected]:text-[#0091ff] data-[selected]:font-semibold disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 stroke-[2.5] text-[#0091ff]" />
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
        "px-3 py-1.5 text-[11px] font-body font-semibold uppercase tracking-wider text-[#838383]",
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
      className={cn("my-1 h-[1px] bg-[#e8e8e8]", className)}
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
