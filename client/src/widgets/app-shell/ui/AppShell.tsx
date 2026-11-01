import { Outlet } from "react-router"
import { Sidebar } from "./Sidebar"
import { UserMenu } from "./UserMenu"
import { useI18n, type Locale } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"

export function AppShell() {
  const { locale, setLocale } = useI18n()

  const toggleLocale = () => {
    const next: Locale = locale === "uz" ? "en" : "uz"
    setLocale(next)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/40 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm text-muted-foreground font-medium" />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLocale}
              className="text-xs font-semibold uppercase px-2 h-8"
            >
              {locale}
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
