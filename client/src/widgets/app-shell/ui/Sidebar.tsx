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
} from "lucide-react"
import { useLocation } from "react-router"
import { useAuthStore } from "@/features/auth"
import { useI18n } from "@/shared/i18n"
import { Link } from "@/shared/ui/link"
import { cn } from "@/shared/lib/utils"

interface NavItem {
  to: string
  labelKey: string
  permission: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
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

/** Shared with the header so the brand row and the top bar sit on one baseline. */
export const SHELL_BAR_HEIGHT = "h-16"

interface SidebarProps {
  collapsed: boolean
}

function SidebarItem({ item, collapsed, isActive }: { item: NavItem; collapsed: boolean; isActive: boolean }) {
  const { t } = useI18n()
  const Icon = item.icon
  const label = t(item.labelKey)
  return (
    <Link
      to={item.to}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={cn(
        "flex items-center gap-3 h-11 rounded-[800px] text-sm font-medium transition-colors no-underline hover:no-underline",
        collapsed ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-ember text-obsidian hover:brightness-105"
          : "text-limestone/70 hover:bg-limestone/10 hover:text-limestone"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission))

  return (
    <aside
      className={cn(
        "bg-obsidian text-limestone flex flex-col h-screen sticky top-0 shrink-0 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className={cn(SHELL_BAR_HEIGHT, "px-4 border-b border-limestone/15 flex items-center gap-3 shrink-0")}>
        <div className="w-10 h-10 rounded-[800px] bg-ember flex items-center justify-center font-display text-xl text-obsidian shrink-0">
          M
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-xl leading-none tracking-wide text-limestone">Malika ERP</h1>
            <p className="text-[11px] text-limestone/60 mt-0.5 truncate">POS & Inventory</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            isActive={location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))}
          />
        ))}
      </nav>
    </aside>
  )
}
