import * as React from "react"
import { Outlet, useLocation } from "react-router"
import { AppShellHeader } from "./AppShellHeader"
import { Sidebar } from "./Sidebar"
import { AdminCommandPalette } from "./AdminCommandPalette"
import { useI18n, type Locale } from "@/shared/i18n"
import { useSyncEngine } from "@/entities/sync"

const COLLAPSED_STORAGE_KEY = "erp_sidebar_collapsed"

function useSidebarState() {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true" ||
        localStorage.getItem("malika_erp_sidebar_collapsed") === "true"
      )
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
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="fixed inset-0 bg-[#090c1d]/35 backdrop-blur-xl backdrop-saturate-200 transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl z-50 animate-in slide-in-from-left duration-200 flex flex-col">
        <Sidebar
          collapsed={false}
          onItemClick={onClose}
          className="w-full h-full border-r border-border"
        />
      </div>
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const { locale, setLocale } = useI18n()
  const [commandOpen, setCommandOpen] = React.useState(false)
  const { collapsed, mobileOpen, setMobileOpen, handleToggleSidebar } = useSidebarState()

  useSyncEngine()
  useKeyboardShortcuts(handleToggleSidebar, () => setCommandOpen(true))

  React.useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  const toggleLocale = React.useCallback(() => {
    const next: Locale = locale === "uz" ? "en" : "uz"
    setLocale(next)
  }, [locale, setLocale])

  return (
    <div className="flex min-h-screen bg-muted text-foreground antialiased">
      <Sidebar
        collapsed={collapsed}
        className="hidden md:flex h-screen sticky top-0"
      />

      <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

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
