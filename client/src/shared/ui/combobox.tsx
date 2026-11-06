import * as React from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/shared/ui/command"

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  /** When set, offers a "create <query>" row for labels not in `options`. */
  allowCreate?: boolean
  onCreate?: (label: string) => void
}

const TRIGGER_CLASS =
  "flex h-10 w-full items-center justify-between rounded-[9px] bg-background px-3.5 text-sm font-body text-foreground border border-input outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"

function ComboboxItems({
  options,
  value,
  onSelect,
}: {
  options: ComboboxOption[]
  value: string
  onSelect: (value: string) => void
}) {
  return (
    <>
      {options.map((opt) => (
        <CommandItem key={opt.value} value={opt.label} onSelect={() => onSelect(opt.value)}>
          <Check
            className={cn(
              "size-4 stroke-[2.5] text-primary",
              opt.value === value ? "opacity-100" : "opacity-0"
            )}
          />
          <span className="truncate">{opt.label}</span>
        </CommandItem>
      ))}
    </>
  )
}

function ComboboxPanel({
  options,
  value,
  query,
  setQuery,
  onSelect,
  onCreate,
  searchPlaceholder,
  emptyText,
}: {
  options: ComboboxOption[]
  value: string
  query: string
  setQuery: (q: string) => void
  onSelect: (value: string) => void
  onCreate?: (label: string) => void
  searchPlaceholder?: string
  emptyText?: string
}) {
  const trimmed = query.trim()
  const canCreate =
    !!onCreate &&
    trimmed.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase())
  return (
    <Command>
      <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} />
      <CommandList>
        {!canCreate && <CommandEmpty>{emptyText}</CommandEmpty>}
        <CommandGroup>
          <ComboboxItems options={options} value={value} onSelect={onSelect} />
          {canCreate && (
            <CommandItem value={`__create__${trimmed}`} onSelect={() => onCreate?.(trimmed)}>
              <Plus className="size-4 stroke-[2.5]" />
              <span className="truncate">{trimmed}</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

/** Single-value searchable select (Popover + cmdk). Trigger mirrors SelectTrigger. */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className,
  allowCreate = false,
  onCreate,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const selected = options.find((o) => o.value === value)
  const createHandler = allowCreate ? onCreate : undefined

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={(next: boolean) => (next ? setOpen(true) : close())}>
      <PopoverTrigger disabled={disabled} className={cn(TRIGGER_CLASS, className)}>
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 stroke-[2] text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] min-w-56 p-0">
        <ComboboxPanel
          options={options}
          value={value}
          query={query}
          setQuery={setQuery}
          onSelect={(v) => {
            onChange(v)
            close()
          }}
          onCreate={createHandler && ((label) => {
            createHandler(label)
            close()
          })}
          searchPlaceholder={searchPlaceholder ?? placeholder}
          emptyText={emptyText}
        />
      </PopoverContent>
    </Popover>
  )
}
