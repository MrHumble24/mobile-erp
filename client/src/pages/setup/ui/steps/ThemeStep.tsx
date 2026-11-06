import { Button } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import { useThemes } from "@/entities/company"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

const FALLBACK_CODES = ["caldera", "sand", "obsidian", "nord"]

const THEME_I18N_KEYS: Record<string, { name: string; desc: string }> = {
  caldera: { name: "setup.themeCalderaName", desc: "setup.themeCalderaDesc" },
  sand: { name: "setup.themeSandName", desc: "setup.themeSandDesc" },
  obsidian: { name: "setup.themeObsidianName", desc: "setup.themeObsidianDesc" },
  nord: { name: "setup.themeNordName", desc: "setup.themeNordDesc" },
}

export function ThemeStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()
  const { data: serverThemes } = useThemes()

  const codes =
    serverThemes && serverThemes.length > 0 ? serverThemes.map((th) => th.code) : FALLBACK_CODES
  const themes = codes
    .filter((code) => THEME_I18N_KEYS[code])
    .map((code) => ({
      code,
      name: t(THEME_I18N_KEYS[code].name),
      desc: t(THEME_I18N_KEYS[code].desc),
    }))

  const currentTheme = state.company.themeCode || "caldera"

  const selectTheme = (code: string) => {
    update((p) => ({ ...p, company: { ...p.company, themeCode: code } }))
    document.documentElement.setAttribute("data-theme", code)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.themeTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.themeSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((th) => {
          const isSelected = currentTheme === th.code
          return (
            <Button
              key={th.code}
              type="button"
              variant="ghost"
              aria-pressed={isSelected}
              onClick={() => selectTheme(th.code)}
              className={`h-auto w-full flex-col items-stretch justify-start gap-3 whitespace-normal rounded-[16px] border-2 border-solid bg-card p-6 text-left font-normal tracking-normal shadow-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected ? "border-primary shadow-xs" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{th.name}</div>
                {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
              <div
                data-theme={th.code}
                className="theme-swatch h-12 w-full rounded-lg border border-border bg-background text-foreground p-2 flex items-center justify-between"
              >
                <span className="text-xs font-medium">{t("setup.themePreviewText")}</span>
                <div className="h-5 px-2 rounded-full text-[10px] font-semibold flex items-center justify-center bg-primary text-primary-foreground">
                  {t("setup.themePreviewAction")}
                </div>
              </div>
              {th.desc && <div className="text-[11px] text-muted-foreground">{th.desc}</div>}
            </Button>
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="h-10 rounded-full px-6">
          {t("setup.back")}
        </Button>
        <Button onClick={onNext} className="h-10 rounded-full px-6 font-semibold shadow-xs">
          {t("setup.next")}
        </Button>
      </div>
    </div>
  )
}
