import { useState } from "react"
import { Outlet } from "react-router"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Sidebar, SHELL_BAR_HEIGHT } from "./Sidebar"
import { UserMenu } from "./UserMenu"
import { useI18n, type Locale } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export function AppShell() {
  const { locale, setLocale, t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)

  const toggleLocale = () => {
    const next: Locale = locale === "uz" ? "en" : "uz"
    setLocale(next)
  }

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#202020]">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={cn(
            SHELL_BAR_HEIGHT,
            "border-b border-[#e8e8e8] bg-white px-4 flex items-center justify-between sticky top-0 z-20"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={t("nav.toggle")}
            aria-expanded={!collapsed}
          >
            <ToggleIcon className="w-4 h-4 text-[#646464]" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLocale}
              className="text-xs font-bold uppercase px-3 h-8 rounded-full"
            >
              {locale}
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
