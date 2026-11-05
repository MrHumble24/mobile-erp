import { useLocation } from "react-router"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
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

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(SHELL_BAR_HEIGHT, "px-4 border-b border-[#e8e8e8] flex items-center gap-2.5 shrink-0")}>
      <div className="size-8 rounded-full bg-[#6647f0] flex items-center justify-center font-display font-bold text-sm text-white shrink-0 shadow-xs">
        M
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-sm font-bold leading-tight tracking-tight text-[#090c1d] truncate">
              Malika ERP
            </h1>
            <span className="size-1.5 rounded-full bg-[#00c07a]" />
          </div>
          <p className="text-[10px] text-[#838383] truncate font-medium">Boshqaruv paneli</p>
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
}: {
  item: NavItemDef
  collapsed: boolean
  isActive: boolean
  onItemClick?: () => void
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
        "flex items-center gap-3 h-9 rounded-full text-xs font-display font-semibold transition-all no-underline hover:no-underline",
        collapsed ? "justify-center px-0 size-9 mx-auto" : "px-3.5 w-full",
        isActive
          ? "bg-[#202020] text-white shadow-xs"
          : "text-[#646464] hover:bg-black/[0.04] hover:text-[#202020]"
      )}
    >
      <Icon className="size-4 shrink-0 stroke-[2.2]" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

function SidebarLinkItem({
  item,
  collapsed,
  isActive,
  onItemClick,
}: {
  item: NavItemDef
  collapsed: boolean
  isActive: boolean
  onItemClick?: () => void
}) {
  const { t } = useI18n()
  const label = t(item.labelKey)

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<SidebarLinkElement item={item} collapsed={collapsed} isActive={isActive} onItemClick={onItemClick} />}
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
    />
  )
}

function SidebarSectionGroup({
  section,
  collapsed,
  onItemClick,
}: {
  section: NavSection
  collapsed: boolean
  onItemClick?: () => void
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
        <div className="text-[10px] tracking-wider text-[#838383] font-mono font-bold uppercase px-3 pt-3 pb-1">
          {t(section.groupKey)}
        </div>
      ) : (
        <div className="my-2 border-t border-[#e8e8e8] mx-2" />
      )}
      {visibleItems.map((item) => {
        const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
        return (
          <SidebarLinkItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            onItemClick={onItemClick}
          />
        )
      })}
    </div>
  )
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null
  return (
    <div className="p-3 border-t border-[#e8e8e8] bg-[#f8f9fa] shrink-0 text-[10px] text-[#838383] flex items-center justify-between">
      <span>Malika v1.2</span>
      <span className="font-mono bg-white border border-[#d4d4d4] px-1.5 py-0.5 rounded">⌘B / ⌘K</span>
    </div>
  )
}

export interface SidebarProps {
  collapsed: boolean
  onItemClick?: () => void
  className?: string
}

export function Sidebar({ collapsed, onItemClick, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-white text-[#202020] border-r border-[#e8e8e8] flex flex-col h-full shrink-0 transition-[width] duration-200 z-30 select-none",
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
          />
        ))}
      </nav>
      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}
