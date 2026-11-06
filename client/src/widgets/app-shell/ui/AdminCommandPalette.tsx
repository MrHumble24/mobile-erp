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
  Store,
  Languages,
  PlusCircle,
  LogOut,
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
import { useAuthStore, LogoutConfirmDialog } from "@/features/auth"
import { useCartStore } from "@/features/checkout"
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
  { to: "/transfers", labelKey: "nav.transfers", permission: "transfer.read", icon: ArrowLeftRight },
  { to: "/qc", labelKey: "nav.qc", permission: "qc.read", icon: CheckCircle2 },
  { to: "/sales", labelKey: "nav.sales", permission: "sale.read", icon: Receipt },
  { to: "/consignments", labelKey: "nav.consignments", permission: "consignment.read", icon: ArrowLeftRight },
  { to: "/partners", labelKey: "nav.partners", permission: "partner.read", icon: Users },
  { to: "/expenses", labelKey: "nav.expenses", permission: "expense.read", icon: DollarSign },
  { to: "/reports", labelKey: "nav.reports", permission: "report.finance", icon: BarChart3 },
  { to: "/users", labelKey: "nav.users", permission: "user.manage", icon: ShieldCheck },
  { to: "/settings", labelKey: "nav.settings", permission: "settings.manage", icon: Settings },
  { to: "/stores", labelKey: "nav.stores", permission: "store.manage", icon: Store },
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
            className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-muted data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium">{label}</span>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function CommandPosItem({ onSelect }: { onSelect: () => void }) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission("sale.create")) return null

  return (
    <CommandItem
      value="Yangi savdo Kassa POS Terminal"
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-muted data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
    >
      <ShoppingCart className="w-4 h-4 text-[#6647f0] shrink-0" />
      <span className="font-medium">Kassa savdosini ochish (POS)</span>
    </CommandItem>
  )
}

function CommandExpenseItem({ onSelect }: { onSelect: () => void }) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission("expense.create")) return null

  return (
    <CommandItem
      value="Xarajat qo'shish kiritish"
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-muted data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
    >
      <PlusCircle className="w-4 h-4 text-[#00c07a] shrink-0" />
      <span className="font-medium">Yangi xarajat kiritish</span>
    </CommandItem>
  )
}

function CommandQuickActionsGroup({
  onNavigate,
  onToggleLocale,
  onOpenLogout,
  currentLocale,
}: {
  onNavigate: (to: string) => void
  onToggleLocale: () => void
  onOpenLogout: () => void
  currentLocale: Locale
}) {
  const { t } = useI18n()

  return (
    <CommandGroup heading="Tezkor amallar">
      <CommandPosItem onSelect={() => onNavigate("/pos")} />
      <CommandExpenseItem onSelect={() => onNavigate("/expenses")} />
      <CommandItem
        value="Tilni o'zgartirish Switch Language UZ EN"
        onSelect={onToggleLocale}
        className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-muted data-[selected=true]:bg-[#202020] data-[selected=true]:text-white"
      >
        <Languages className="w-4 h-4 text-[#0091ff] shrink-0" />
        <span className="font-medium">
          Tilni almashtirish ({currentLocale === "uz" ? "O'zbekcha -> English" : "English -> O'zbekcha"})
        </span>
      </CommandItem>
      <CommandItem
        value="Tizimdan chiqish Chiqish Log out Logout"
        onSelect={onOpenLogout}
        className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-full cursor-pointer hover:bg-muted data-[selected=true]:bg-[#e53935] data-[selected=true]:text-white text-[#e53935]"
      >
        <LogOut className="w-4 h-4 text-[#e53935] shrink-0" />
        <span className="font-medium">{t("auth.logout")}</span>
      </CommandItem>
    </CommandGroup>
  )
}

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = React.useState(false)

  const handleSelect = (to: string) => {
    navigate(to)
    onOpenChange(false)
  }

  const handleToggleLocale = () => {
    setLocale(locale === "uz" ? "en" : "uz")
    onOpenChange(false)
  }

  const handleOpenLogout = () => {
    onOpenChange(false)
    setLogoutOpen(true)
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder={t("nav.searchPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("nav.searchNoResults")}</CommandEmpty>
          <CommandNavGroup onSelect={handleSelect} />
          <CommandSeparator className="my-1 border-border" />
          <CommandQuickActionsGroup
            onNavigate={handleSelect}
            onToggleLocale={handleToggleLocale}
            onOpenLogout={handleOpenLogout}
            currentLocale={locale}
          />
        </CommandList>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] font-mono">↑↓</kbd> Harakat</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] font-mono">↵</kbd> Tanlash</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] font-mono">Esc</kbd> Yopish</span>
        </div>
      </CommandDialog>

      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => useCartStore.getState().clear()}
      />
    </>
  )
}

