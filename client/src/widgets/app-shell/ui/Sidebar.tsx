import { useLocation } from "react-router"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import { useBranding } from "@/entities/company"
import { useStorefrontOrderStats } from "@/entities/order"
import { useI18n } from "@/shared/i18n"
import { Link } from "@/shared/ui/link"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import {
  SHELL_BAR_HEIGHT,
  NAV_SECTIONS,
  type NavItemDef,
  type NavSection,
} from "../model/navigation"
import { AssetImage } from "@/shared/ui"

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  const { data: branding } = useBranding()
  const name = branding?.name || "ERP"
  const initial = name.charAt(0).toUpperCase() || "E"

  return (
    <div className={cn(SHELL_BAR_HEIGHT, "px-4 border-b border-border flex items-center gap-2.5 shrink-0")}>
      <div className="size-8 rounded-full bg-primary flex items-center justify-center font-display font-bold text-sm text-primary-foreground shrink-0 shadow-xs overflow-hidden">
        {branding?.logoUrl ? (
          <AssetImage path={branding.logoUrl} alt={name} className="size-full" />
        ) : (
          initial
        )}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-sm font-bold leading-tight tracking-tight text-foreground truncate">
              {name}
            </h1>
            <span className="size-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-[10px] text-muted-foreground truncate font-medium">ERP</p>
        </div>
      )}
    </div>
  )
}

function SidebarLinkElement({
  item,
  collapsed,
  isActive,
  onItemClick,
  badgeCount,
}: {
  item: NavItemDef
  collapsed: boolean
  isActive: boolean
  onItemClick?: () => void
  badgeCount?: number
}) {
  const { t } = useI18n()
  const Icon = item.icon
  const label = t(item.labelKey)

  return (
    <Link
      to={item.to}
      onClick={onItemClick}
      aria-label={label}
      className={cn(
        "flex items-center gap-3 h-9 rounded-full text-xs font-display font-semibold transition-all no-underline hover:no-underline relative",
        collapsed ? "justify-center px-0 size-9 mx-auto" : "px-3.5 w-full",
        isActive
          ? "bg-primary text-primary-foreground shadow-xs"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0 stroke-[2.2]" />
      {!collapsed && <span className="truncate">{label}</span>}
      {Boolean(badgeCount && badgeCount > 0) && (
        <span
          className={cn(
            "font-mono font-bold text-white bg-blue-600 rounded-full flex items-center justify-center",
            collapsed
              ? "absolute top-1 right-1 size-2 ring-2 ring-card"
              : "ml-auto px-1.5 h-4 min-w-4 text-[10px]"
          )}
        >
          {!collapsed && badgeCount}
        </span>
      )}
    </Link>
  )
}

function SidebarLinkItem({
  item,
  collapsed,
  isActive,
  onItemClick,
  badgeCount,
}: {
  item: NavItemDef
  collapsed: boolean
  isActive: boolean
  onItemClick?: () => void
  badgeCount?: number
}) {
  const { t } = useI18n()
  const label = t(item.labelKey)

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <SidebarLinkElement
              item={item}
              collapsed={collapsed}
              isActive={isActive}
              onItemClick={onItemClick}
              badgeCount={badgeCount}
            />
          }
        />
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <SidebarLinkElement
      item={item}
      collapsed={collapsed}
      isActive={isActive}
      onItemClick={onItemClick}
      badgeCount={badgeCount}
    />
  )
}

function SidebarSectionGroup({
  section,
  collapsed,
  onItemClick,
  newOrdersCount,
}: {
  section: NavSection
  collapsed: boolean
  onItemClick?: () => void
  newOrdersCount?: number
}) {
  const { t } = useI18n()
  const location = useLocation()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const { data: settings } = useSettings()

  const visibleItems = section.items.filter(
    (item) =>
      hasPermission(item.permission) &&
      (!item.requiresSetting || settings?.[item.requiresSetting] === true)
  )
  if (visibleItems.length === 0) return null

  return (
    <div className="space-y-0.5">
      {!collapsed ? (
        <div className="text-[10px] tracking-wider text-muted-foreground font-mono font-bold uppercase px-3 pt-3 pb-1">
          {t(section.groupKey)}
        </div>
      ) : (
        <div className="my-2 border-t border-border mx-2" />
      )}
      {visibleItems.map((item) => {
        const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
        const badgeCount = item.to === "/orders" ? newOrdersCount : undefined
        return (
          <SidebarLinkItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            onItemClick={onItemClick}
            badgeCount={badgeCount}
          />
        )
      })}
    </div>
  )
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { data: branding } = useBranding()
  if (collapsed) return null
  return (
    <div className="p-3 border-t border-border bg-muted shrink-0 text-[10px] text-muted-foreground flex items-center justify-between">
      <span>{branding?.name || "ERP"} v1.2</span>
      <span className="font-mono bg-muted border border-border px-1.5 py-0.5 rounded">⌘B / ⌘K</span>
    </div>
  )
}

export interface SidebarProps {
  collapsed: boolean
  onItemClick?: () => void
  className?: string
}

export function Sidebar({ collapsed, onItemClick, className }: SidebarProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canReadOrders = hasPermission("order.read")
  const { data: orderStats } = useStorefrontOrderStats()
  const newOrdersCount = canReadOrders ? (orderStats?.new ?? 0) : 0

  return (
    <aside
      className={cn(
        "bg-card text-foreground border-r border-border flex flex-col h-full shrink-0 transition-[width] duration-200 z-30 select-none",
        collapsed ? "w-[68px]" : "w-60",
        className
      )}
    >
      <SidebarBrand collapsed={collapsed} />
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {NAV_SECTIONS.map((section) => (
          <SidebarSectionGroup
            key={section.groupKey}
            section={section}
            collapsed={collapsed}
            onItemClick={onItemClick}
            newOrdersCount={newOrdersCount}
          />
        ))}
      </nav>
      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}
