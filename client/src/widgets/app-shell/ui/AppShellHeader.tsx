import { useLocation } from "react-router"
import { PanelLeftClose, PanelLeftOpen, Search, ShoppingCart } from "lucide-react"
import { useAuthStore } from "@/features/auth"
import { useI18n, type Locale } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { UserMenu } from "./UserMenu"
import { SHELL_BAR_HEIGHT, ALL_NAV_ITEMS } from "../model/navigation"
import { cn } from "@/shared/lib/utils"

interface AppShellHeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenSearch: () => void
  locale: Locale
  onToggleLocale: () => void
}

function HeaderBreadcrumbs() {
  const { t } = useI18n()
  const location = useLocation()
  const currentItem = ALL_NAV_ITEMS.find(
    (item) => item.to === location.pathname || (item.to !== "/" && location.pathname.startsWith(item.to))
  )

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-[#838383] min-w-0">
      <span className="hidden sm:inline hover:text-[#202020] transition-colors truncate">
        Malika ERP
      </span>
      {currentItem && (
        <>
          <span className="text-[#d4d4d4] hidden sm:inline">/</span>
          <span className="text-[#090c1d] font-semibold font-display truncate">
            {t(currentItem.labelKey)}
          </span>
        </>
      )}
    </div>
  )
}

function HeaderCenterActions({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { t } = useI18n()
  return (
    <Button
      variant="outline"
      onClick={onOpenSearch}
      className="hidden md:flex items-center justify-start gap-2.5 h-8 px-3 rounded-full bg-[#f8f9fa] border border-[#e8e8e8] text-xs font-normal text-[#838383] hover:border-[#b3b3b3] hover:text-[#202020] transition-colors cursor-pointer w-44 lg:w-64"
    >
      <Search className="size-3.5 text-[#838383] shrink-0" />
      <span className="truncate flex-1 text-left">{t("nav.searchPlaceholder")}</span>
      <kbd className="hidden lg:inline-flex px-1.5 py-0.5 rounded bg-white border border-[#d4d4d4] text-[10px] font-mono text-[#838383]">
        ⌘K
      </kbd>
    </Button>
  )
}

function HeaderRightActions({
  locale,
  onToggleLocale,
  onOpenSearch,
}: {
  locale: Locale
  onToggleLocale: () => void
  onOpenSearch: () => void
}) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden size-8 rounded-full text-[#646464]"
        onClick={onOpenSearch}
        aria-label={t("nav.searchPlaceholder")}
      >
        <Search className="size-4" />
      </Button>

      {hasPermission("sale.create") && (
        <Link
          to="/pos"
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#202020] text-white hover:bg-black text-xs font-semibold no-underline shadow-xs transition-colors"
        >
          <ShoppingCart className="size-3.5" />
          <span>{t("nav.quickPos")}</span>
        </Link>
      )}

      <div className="hidden xl:flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-[#6ee7b7]/15 text-[#00a86b] text-[11px] font-medium border border-[#6ee7b7]/30">
        <span className="size-1.5 rounded-full bg-[#00c07a] animate-pulse" />
        <span>{t("nav.statusOnline")}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleLocale}
        className="text-[11px] font-bold uppercase px-2.5 h-8 rounded-full border-[#e8e8e8] text-[#202020]"
      >
        {locale}
      </Button>

      <UserMenu />
    </div>
  )
}

export function AppShellHeader({
  collapsed,
  onToggleSidebar,
  onOpenSearch,
  locale,
  onToggleLocale,
}: AppShellHeaderProps) {
  const { t } = useI18n()
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <header
      className={cn(
        SHELL_BAR_HEIGHT,
        "border-b border-[#e8e8e8] bg-white px-3 sm:px-4 flex items-center justify-between sticky top-0 z-20 gap-3"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full shrink-0 text-[#646464] hover:bg-black/[0.04]"
          onClick={onToggleSidebar}
          aria-label={t("nav.toggle")}
          aria-expanded={!collapsed}
        >
          <ToggleIcon className="size-4" />
        </Button>
        <HeaderBreadcrumbs />
      </div>

      <HeaderCenterActions onOpenSearch={onOpenSearch} />

      <HeaderRightActions
        locale={locale}
        onToggleLocale={onToggleLocale}
        onOpenSearch={onOpenSearch}
      />
    </header>
  )
}
