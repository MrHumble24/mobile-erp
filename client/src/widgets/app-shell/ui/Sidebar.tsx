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

export const SHELL_BAR_HEIGHT = "h-14"

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
        "flex items-center gap-2.5 h-9 rounded-full text-xs font-display font-semibold transition-colors no-underline hover:no-underline",
        collapsed ? "justify-center px-0" : "px-3.5",
        isActive
          ? "bg-[#202020] text-white"
          : "text-[#646464] hover:bg-black/[0.04] hover:text-[#202020]"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
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
        "bg-white text-[#202020] border-r border-[#e8e8e8] flex flex-col h-screen sticky top-0 shrink-0 transition-[width] duration-200 z-30",
        collapsed ? "w-[64px]" : "w-60"
      )}
    >
      <div className={cn(SHELL_BAR_HEIGHT, "px-4 border-b border-[#e8e8e8] flex items-center gap-2.5 shrink-0")}>
        <div className="w-8 h-8 rounded-full bg-[#6647f0] flex items-center justify-center font-display font-bold text-sm text-white shrink-0 shadow-xs">
          M
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold leading-tight tracking-tight text-[#090c1d]">Malika ERP</h1>
            <p className="text-[10px] text-[#838383] truncate">Productivity POS</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">
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
