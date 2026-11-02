import * as React from "react"
import { ChevronDown } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { useCustomers, type CustomerView } from "@/entities/customer"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command"

export interface CustomerSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: CustomerView) => void
}

const TRIGGER_CLASS =
  "flex h-10 w-full items-center justify-between rounded-[9px] bg-white px-3.5 text-sm text-[#838383] border border-[#d4d4d4] outline-none transition-all focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/20 cursor-pointer"

export function CustomerSearch({ open, onOpenChange, onSelect }: CustomerSearchProps) {
  const { t } = useI18n()
  const [query, setQuery] = React.useState("")
  const debounced = useDebounce(query, 300)
  const { data: customers } = useCustomers(debounced)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger className={TRIGGER_CLASS}>
        <span className="truncate">{t("pos.searchCustomer")}</span>
        <ChevronDown className="size-4 shrink-0 stroke-[2]" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] min-w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("pos.searchCustomer")} />
          <CommandList>
            <CommandEmpty>{t("common.notFound")}</CommandEmpty>
            <CommandGroup>
              {customers?.map((c) => (
                <CommandItem key={c.id} value={c.id} onSelect={() => onSelect(c)}>
                  <span className="truncate">{c.name}</span>
                  {c.phone && (
                    <span className="ml-auto text-xs text-muted-foreground font-mono">{c.phone}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
