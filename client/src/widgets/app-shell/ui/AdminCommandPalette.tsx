import * as React from "react"
import { useNavigate } from "react-router"
import {
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  Truck,
  CheckCircle2,
  Receipt,
  ArrowLeftRight,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  Languages,
  PlusCircle,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/shared/ui/command"
import { useAuthStore } from "@/features/auth"
import { useI18n, type Locale } from "@/shared/i18n"

interface AdminCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface NavCommand {
  to: string
  labelKey: string
  permission: string
  icon: React.ComponentType<{ className?: string }>
}

const COMMAND_NAV_ITEMS: NavCommand[] = [
  { to: "/", labelKey: "nav.dashboard", permission: "report.finance", icon: LayoutDashboard },
  { to: "/pos", labelKey: "nav.pos", permission: "sale.create", icon: ShoppingCart },
  { to: "/inventory", labelKey: "nav.inventory", permission: "device.read", icon: Smartphone },
  { to: "/shipments", labelKey: "nav.shipments", permission: "shipment.read", icon: Truck },
  { to: "/qc", labelKey: "nav.qc", permission: "qc.read", icon: CheckCircle2 },
  { to: "/sales", labelKey: "nav.sales", permission: "sale.read", icon: Receipt },
  { to: "/consignments", labelKey: "nav.consignments", permission: "consignment.read", icon: ArrowLeftRight },
  { to: "/partners", labelKey: "nav.partners", permission: "partner.read", icon: Users },
  { to: "/expenses", labelKey: "nav.expenses", permission: "expense.read", icon: DollarSign },
  { to: "/reports", labelKey: "nav.reports", permission: "report.finance", icon: BarChart3 },
  { to: "/users", labelKey: "nav.users", permission: "user.manage", icon: ShieldCheck },
  { to: "/settings", labelKey: "nav.settings", permission: "settings.manage", icon: Settings },
]

function CommandNavGroup({
  onSelect,
}: {
  onSelect: (to: string) => void
}) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const items = COMMAND_NAV_ITEMS.filter((item) => hasPermission(item.permission))

  return (
    <CommandGroup heading={t("nav.searchCommandTitle")}>
      {items.map((item) => {
        const Icon = item.icon
        const label = t(item.labelKey)
        return (
          <CommandItem
            key={item.to}
            value={label}
            onSelect={() => onSelect(item.to)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-[#f8f9fa] data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium">{label}</span>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function CommandQuickActionsGroup({
  onNavigate,
  onToggleLocale,
  currentLocale,
}: {
  onNavigate: (to: string) => void
  onToggleLocale: () => void
  currentLocale: Locale
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return (
    <CommandGroup heading="Tezkor amallar">
      {hasPermission("sale.create") && (
        <CommandItem
          value="Yangi savdo Kassa POS Terminal"
          onSelect={() => onNavigate("/pos")}
          className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-[#f8f9fa] data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
        >
          <ShoppingCart className="w-4 h-4 text-[#6647f0] shrink-0" />
          <span className="font-medium">Kassa savdosini ochish (POS)</span>
        </CommandItem>
      )}
      {hasPermission("expense.create") && (
        <CommandItem
          value="Xarajat qo'shish kiritish"
          onSelect={() => onNavigate("/expenses")}
          className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-[#f8f9fa] data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
        >
          <PlusCircle className="w-4 h-4 text-[#00c07a] shrink-0" />
          <span className="font-medium">Yangi xarajat kiritish</span>
        </CommandItem>
      )}
      <CommandItem
        value="Tilni o'zgartirish Switch Language UZ EN"
        onSelect={onToggleLocale}
        className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-[#f8f9fa] data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
      >
        <Languages className="w-4 h-4 text-[#0091ff] shrink-0" />
        <span className="font-medium">
          Tilni almashtirish ({currentLocale === "uz" ? "O'zbekcha -> English" : "English -> O'zbekcha"})
        </span>
      </CommandItem>
    </CommandGroup>
  )
}

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()

  const handleSelect = (to: string) => {
    navigate(to)
    onOpenChange(false)
  }

  const handleToggleLocale = () => {
    setLocale(locale === "uz" ? "en" : "uz")
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("nav.searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{t("nav.searchNoResults")}</CommandEmpty>
        <CommandNavGroup onSelect={handleSelect} />
        <CommandSeparator className="my-1 border-[#e8e8e8]" />
        <CommandQuickActionsGroup
          onNavigate={handleSelect}
          onToggleLocale={handleToggleLocale}
          currentLocale={locale}
        />
      </CommandList>
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#e8e8e8] bg-[#f8f9fa] text-[10px] text-[#838383]">
        <div className="flex items-center gap-2">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] font-mono">↑↓</kbd> Harakat</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] font-mono">↵</kbd> Tanlash</span>
        </div>
        <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] font-mono">Esc</kbd> Yopish</span>
      </div>
    </CommandDialog>
  )
}
