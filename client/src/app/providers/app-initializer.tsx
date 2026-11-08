import { useEffect } from "react"
import { useBranding } from "@/entities/company"
import { setCurrencyConfig } from "@/shared/lib/format"
import { useI18nStore, type Locale } from "@/shared/i18n"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { data: branding } = useBranding()

  useEffect(() => {
    if (!branding) return

    if (branding.currency) {
      setCurrencyConfig(branding.currency)
    }

    const savedLocale = localStorage.getItem("erp_locale")
    if (!savedLocale && (branding.defaultLanguage === "uz" || branding.defaultLanguage === "en" || branding.defaultLanguage === "ru")) {
      useI18nStore.getState().setLocale(branding.defaultLanguage as Locale)
    }

    const savedTheme = localStorage.getItem("erp_theme")
    const themeToApply = savedTheme || branding.themeCode || "caldera"
    document.documentElement.setAttribute("data-theme", themeToApply)

    const themeColors: Record<string, string> = {
      caldera: "#ffffff",
      obsidian: "#0f1117",
      sand: "#fcfaf6",
      nord: "#2e3440",
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute("content", themeColors[themeToApply] || "#863bff")
    }

    if (branding.name) {
      document.title = branding.name
    }
  }, [branding])

  return <>{children}</>
}
