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

export function Sidebar() {
  const { t } = useI18n()
  const location = useLocation()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission))

  return (
    <aside className="w-64 border-r border-border bg-card/50 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
          M
        </div>
        <div>
          <h1 className="font-bold text-base leading-none tracking-tight">Malika ERP</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">POS & Inventory</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
