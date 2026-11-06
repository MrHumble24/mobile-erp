import { Button, Card, CardContent } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import { useThemes } from "@/entities/company"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

const FALLBACK_THEMES = [
  { code: "caldera", name: "Caldera Light" },
  { code: "obsidian", name: "Obsidian Dark" },
  { code: "sand", name: "Warm Sand" },
  { code: "nord", name: "Nord Slate" },
]

const THEME_DESCRIPTIONS: Record<string, string> = {
  caldera: "Default warm light retail theme",
  obsidian: "High-contrast dark palette",
  sand: "Subtle desert ochre palette",
  nord: "Arctic slate dark palette",
}

export function ThemeStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()
  const { data: serverThemes } = useThemes()

  const themes = (serverThemes && serverThemes.length > 0 ? serverThemes : FALLBACK_THEMES).map((th) => ({
    ...th,
    desc: THEME_DESCRIPTIONS[th.code] || "",
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
            <Card
              key={th.code}
              className={`cursor-pointer transition-all border-2 ${
                isSelected ? "border-primary shadow-xs" : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => selectTheme(th.code)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{th.name}</div>
                  {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
                <div
                  data-theme={th.code}
                  className="h-12 rounded-lg border border-border bg-background text-foreground p-2 flex items-center justify-between"
                >
                  <span className="text-xs font-medium">Text preview</span>
                  <div className="h-5 px-2 rounded-full text-[10px] font-semibold flex items-center justify-center bg-primary text-primary-foreground">
                    Action
                  </div>
                </div>
                {th.desc && <div className="text-[11px] text-muted-foreground">{th.desc}</div>}
              </CardContent>
            </Card>
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
