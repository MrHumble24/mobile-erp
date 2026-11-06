import * as React from "react"
import { ChevronDown, UserPlus, User, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command"
import { useCustomers } from "../model/use-customers"
import { CustomerPoints } from "./CustomerPoints"

/** Who a purchase / trade-in is from: an existing customer, or a new name + phone. */
export type CustomerSelection =
  | { customerId: string; name: string; phone: string | null }
  | { name: string; phone?: string }

export interface CustomerPickerProps {
  value: CustomerSelection | null
  onChange: (value: CustomerSelection | null) => void
}

function selectionName(value: CustomerSelection): string {
  return value.name
}

function SelectedChip({ value, onClear }: { value: CustomerSelection; onClear: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between rounded-[10px] bg-[#f8f9fa] border border-[#e8e8e8] p-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <User className="size-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{selectionName(value)}</p>
          <p className="text-xs text-muted-foreground font-mono">{value.phone || t("pos.walkIn")}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClear} aria-label={t("common.close")}>
        <X className="size-4" />
      </Button>
    </div>
  )
}

const TRIGGER_CLASS =
  "flex h-10 w-full items-center justify-between rounded-[9px] bg-white px-3.5 text-sm text-[#838383] border border-[#d4d4d4] outline-none transition-all focus:border-[#0091ff] cursor-pointer"

function ExistingSearch({ onChange }: { onChange: (v: CustomerSelection) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const { data: customers } = useCustomers(useDebounce(query, 300))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={TRIGGER_CLASS}>
        <span className="truncate">{t("purchases.searchCustomer")}</span>
        <ChevronDown className="size-4 shrink-0 stroke-[2]" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] min-w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("purchases.searchCustomer")} />
          <CommandList>
            <CommandEmpty>{t("common.notFound")}</CommandEmpty>
            <CommandGroup>
              {customers?.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange({ customerId: c.id, name: c.name, phone: c.phone })
                    setOpen(false)
                  }}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{c.name}</span>
                    <CustomerPoints points={c.bonusBalance} />
                  </span>
                  {c.phone && <span className="ml-auto text-xs text-muted-foreground font-mono">{c.phone}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function NewCustomerInputs({ onChange }: { onChange: (v: CustomerSelection | null) => void }) {
  const { t } = useI18n()
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  // Lift the typed name/phone up on each keystroke; an empty name clears the selection.
  const push = (n: string, p: string) =>
    onChange(n.trim() ? { name: n.trim(), phone: p.trim() || undefined } : null)
  return (
    <div className="space-y-2">
      <Input
        value={name}
        onChange={(e) => { setName(e.target.value); push(e.target.value, phone) }}
        placeholder={t("purchases.sellerName")}
        className="h-10"
      />
      <Input
        value={phone}
        onChange={(e) => { setPhone(e.target.value); push(name, e.target.value) }}
        placeholder={t("purchases.sellerPhone")}
        className="h-10"
      />
    </div>
  )
}

/** Pick an existing customer or type a new name + phone. The seller of a used phone. */
export function CustomerPicker({ value, onChange }: CustomerPickerProps) {
  const { t } = useI18n()
  const [mode, setMode] = React.useState<"search" | "new">("search")

  if (value && "customerId" in value) {
    return <SelectedChip value={value} onClear={() => onChange(null)} />
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => {
            onChange(null)
            setMode((m) => (m === "new" ? "search" : "new"))
          }}
        >
          <UserPlus className="size-3.5" />
          {mode === "new" ? t("purchases.searchCustomer") : t("purchases.newCustomer")}
        </Button>
      </div>
      {mode === "new" ? (
        <NewCustomerInputs onChange={onChange} />
      ) : (
        <ExistingSearch onChange={onChange} />
      )}
    </div>
  )
}
