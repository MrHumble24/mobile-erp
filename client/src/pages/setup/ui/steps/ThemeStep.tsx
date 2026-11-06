import { Button, Card, CardContent } from "@/shared/ui"
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
    { code: "caldera", name: "Caldera Light", desc: "Default warm light retail theme", bg: "#f8f9fa", fg: "#202020", primary: "#202020" },
    { code: "obsidian", name: "Obsidian Dark", desc: "Sleek high-contrast dark theme", bg: "#121214", fg: "#f4f4f5", primary: "#ffffff" },
    { code: "sand", name: "Warm Sand", desc: "Subtle desert ochre palette", bg: "#f7f5f0", fg: "#262320", primary: "#383129" },
    { code: "nord", name: "Nord Slate", desc: "Cool arctic slate blue design", bg: "#f0f4f8", fg: "#1a2530", primary: "#2563eb" },
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
                  className="h-12 rounded-lg border p-2 flex items-center justify-between"
                  style={{ backgroundColor: th.bg, color: th.fg, borderColor: th.fg + "20" }}
                >
                  <span className="text-xs font-medium">Text preview</span>
                  <div className="h-5 px-2 rounded-full text-[10px] font-semibold flex items-center justify-center" style={{ backgroundColor: th.primary, color: th.bg }}>
                    Action
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">{th.desc}</div>
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
