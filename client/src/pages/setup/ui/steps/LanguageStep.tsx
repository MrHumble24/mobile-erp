import { Button, Card, CardContent } from "@/shared/ui"
import { useI18n, type Locale } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
}

export function LanguageStep({ state, update, onNext }: Props) {
  const { t, setLocale } = useI18n()

  const chooseLanguage = (lang: Locale) => {
    setLocale(lang)
    update((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        defaultLanguage: lang,
      },
    }))
  }

  const currentLang = state.company.defaultLanguage || "uz"

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.stepLanguage")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all border-2 ${
            currentLang === "uz" ? "border-primary shadow-xs" : "border-border hover:border-muted-foreground/30"
          }`}
          onClick={() => chooseLanguage("uz")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-base">O'zbekcha</div>
              <div className="text-xs text-muted-foreground">Lotin alifbosida</div>
            </div>
            {currentLang === "uz" && <div className="h-3 w-3 rounded-full bg-primary" />}
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-2 ${
            currentLang === "en" ? "border-primary shadow-xs" : "border-border hover:border-muted-foreground/30"
          }`}
          onClick={() => chooseLanguage("en")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-base">English</div>
              <div className="text-xs text-muted-foreground">International</div>
            </div>
            {currentLang === "en" && <div className="h-3 w-3 rounded-full bg-primary" />}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} className="h-10 rounded-full px-6 font-semibold shadow-xs">
          {t("setup.next")}
        </Button>
      </div>
    </div>
  )
}
