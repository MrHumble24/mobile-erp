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
    if (!savedLocale && (branding.defaultLanguage === "uz" || branding.defaultLanguage === "en")) {
      useI18nStore.getState().setLocale(branding.defaultLanguage as Locale)
    }

    const savedTheme = localStorage.getItem("erp_theme")
    if (!savedTheme && branding.themeCode) {
      document.documentElement.setAttribute("data-theme", branding.themeCode)
    }

    if (branding.name) {
      document.title = branding.name
    }
  }, [branding])

  return <>{children}</>
}
