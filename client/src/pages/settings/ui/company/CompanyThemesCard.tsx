import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import { useThemes, type CompanyProfile, type UpdateCompanyProfileDto } from "@/entities/company"

interface CompanyThemesCardProps {
  profile?: CompanyProfile
  form: UpdateCompanyProfileDto
  onChange: (patch: Partial<UpdateCompanyProfileDto>) => void
  disabled: boolean
}

const FALLBACK_THEMES = [
  { code: "caldera", name: "Caldera Light" },
  { code: "obsidian", name: "Obsidian Dark" },
  { code: "sand", name: "Warm Sand" },
  { code: "nord", name: "Nord Slate" },
]

export function CompanyThemesCard({
  profile,
  form,
  onChange,
  disabled,
}: CompanyThemesCardProps) {
  const { t } = useI18n()
  const { data: themes } = useThemes()
  const activeTheme = form.themeCode ?? profile?.themeCode ?? "caldera"

  const handleSelectTheme = (code: string) => {
    onChange({ themeCode: code })
    document.documentElement.setAttribute("data-theme", code)
    const themeColors: Record<string, string> = {
      caldera: "#ffffff",
      obsidian: "#0f1117",
      sand: "#fcfaf6",
      nord: "#2e3440",
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute("content", themeColors[code] || "#863bff")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("settings.theme")}</CardTitle>
        <CardDescription className="text-xs">{t("setup.themeSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(themes || FALLBACK_THEMES).map((th) => {
            const isSelected = activeTheme === th.code
            return (
              <Button
                key={th.code}
                type="button"
                variant="ghost"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => handleSelectTheme(th.code)}
                className={`h-auto w-full flex-col items-stretch justify-start gap-0 whitespace-normal rounded-xl border-2 border-solid bg-card p-3 text-left font-normal tracking-normal shadow-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected ? "border-primary shadow-xs" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-semibold">{th.name}</span>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div
                  data-theme={th.code}
                  className="theme-swatch mt-2 h-7 w-full rounded-md border border-border bg-background text-foreground flex items-center justify-between px-2 text-[10px]"
                >
                  <span>Aa 123</span>
                  <span className="h-4 px-1.5 rounded-full text-[9px] font-medium bg-primary text-primary-foreground flex items-center">
                    OK
                  </span>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
