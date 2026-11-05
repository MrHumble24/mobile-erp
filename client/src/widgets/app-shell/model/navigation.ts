import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  Truck,
  CheckCircle2,
  Receipt,
  ArrowLeftRight,
  Users,
  UserRound,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  RefreshCw,
  Wallet,
} from "lucide-react"

export const SHELL_BAR_HEIGHT = "h-14"

export interface NavItemDef {
  to: string
  labelKey: string
  permission: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NavSection {
  groupKey: string
  items: NavItemDef[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    groupKey: "nav.groupOperations",
    items: [
      { to: "/", labelKey: "nav.dashboard", permission: "report.finance", icon: LayoutDashboard },
      { to: "/pos", labelKey: "nav.pos", permission: "sale.create", icon: ShoppingCart },
      { to: "/inventory", labelKey: "nav.inventory", permission: "device.read", icon: Smartphone },
      { to: "/shipments", labelKey: "nav.shipments", permission: "shipment.read", icon: Truck },
      { to: "/qc", labelKey: "nav.qc", permission: "qc.read", icon: CheckCircle2 },
    ],
  },
  {
    groupKey: "nav.groupFinance",
    items: [
      { to: "/sales", labelKey: "nav.sales", permission: "sale.read", icon: Receipt },
      { to: "/customers", labelKey: "nav.customers", permission: "customer.read", icon: UserRound },
      { to: "/consignments", labelKey: "nav.consignments", permission: "consignment.read", icon: ArrowLeftRight },
      { to: "/partners", labelKey: "nav.partners", permission: "partner.read", icon: Users },
      { to: "/expenses", labelKey: "nav.expenses", permission: "expense.read", icon: DollarSign },
      { to: "/balance", labelKey: "nav.balance", permission: "balance.read", icon: Wallet },
      { to: "/reports", labelKey: "nav.reports", permission: "report.finance", icon: BarChart3 },
    ],
  },
  {
    groupKey: "nav.groupAdmin",
    items: [
      { to: "/users", labelKey: "nav.users", permission: "user.manage", icon: ShieldCheck },
      { to: "/sync", labelKey: "nav.sync", permission: "sync.resolve", icon: RefreshCw },
      { to: "/settings", labelKey: "nav.settings", permission: "settings.manage", icon: Settings },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItemDef[] = NAV_SECTIONS.flatMap((s) => s.items)

