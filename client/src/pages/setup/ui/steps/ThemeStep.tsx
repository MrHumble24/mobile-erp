import { Button } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

export function ThemeStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()

  const themes = [
    { code: "caldera", name: t("setup.themeCalderaName"), desc: t("setup.themeCalderaDesc"), bg: "#f8f9fa", fg: "#202020", primary: "#202020" },
    { code: "sand", name: t("setup.themeSandName"), desc: t("setup.themeSandDesc"), bg: "#f7f5f0", fg: "#262320", primary: "#383129" },
  ]

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
              className={`h-auto w-full flex-col items-stretch justify-start gap-0 whitespace-normal rounded-[16px] border-2 border-solid bg-card p-6 text-left font-normal tracking-normal shadow-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected ? "border-primary shadow-xs" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{th.name}</div>
                  {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
                <div
                  className="h-12 rounded-lg border p-2 flex items-center justify-between"
                  style={{ backgroundColor: th.bg, color: th.fg, borderColor: th.fg + "20" }}
                >
                  <span className="text-xs font-medium">{t("setup.themePreviewText")}</span>
                  <div className="h-5 px-2 rounded-full text-[10px] font-semibold flex items-center justify-center" style={{ backgroundColor: th.primary, color: th.bg }}>
                    {t("setup.themePreviewAction")}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">{th.desc}</div>
              </div>
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
