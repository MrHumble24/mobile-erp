import * as React from "react"
import { Outlet, useLocation } from "react-router"
import { AppShellHeader } from "./AppShellHeader"
import { Sidebar } from "./Sidebar"
import { AdminCommandPalette } from "./AdminCommandPalette"
import { Sheet, SheetPopup } from "@/shared/ui/sheet"
import { useI18n, type Locale } from "@/shared/i18n"

const COLLAPSED_STORAGE_KEY = "malika_erp_sidebar_collapsed"

function useSidebarState() {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [])

  const handleToggleSidebar = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev)
    } else {
      toggleCollapsed()
    }
  }, [toggleCollapsed])

  return { collapsed, mobileOpen, setMobileOpen, handleToggleSidebar }
}

function useKeyboardShortcuts(onToggleSidebar: () => void, onOpenSearch: () => void) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        onToggleSidebar()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenSearch()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onToggleSidebar, onOpenSearch])
}

function MobileSidebarDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="left" className="p-0 w-72 max-w-[85vw] border-r border-[#e8e8e8]">
        <Sidebar
          collapsed={false}
          onItemClick={() => onOpenChange(false)}
          className="border-none w-full h-full"
        />
      </SheetPopup>
    </Sheet>
  )
}

export function AppShell() {
  const location = useLocation()
  const { locale, setLocale } = useI18n()
  const [commandOpen, setCommandOpen] = React.useState(false)
  const { collapsed, mobileOpen, setMobileOpen, handleToggleSidebar } = useSidebarState()

  useKeyboardShortcuts(handleToggleSidebar, () => setCommandOpen(true))

  // Close mobile drawer whenever location changes
  React.useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  const toggleLocale = React.useCallback(() => {
    const next: Locale = locale === "uz" ? "en" : "uz"
    setLocale(next)
  }, [locale, setLocale])

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#202020] antialiased">
      {/* Desktop Sticky Collapsible Sidebar */}
      <Sidebar
        collapsed={collapsed}
        className="hidden md:flex h-screen sticky top-0"
      />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebarDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppShellHeader
          collapsed={collapsed}
          onToggleSidebar={handleToggleSidebar}
          onOpenSearch={() => setCommandOpen(true)}
          locale={locale}
          onToggleLocale={toggleLocale}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">
          <div className="max-w-[1600px] w-full mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
