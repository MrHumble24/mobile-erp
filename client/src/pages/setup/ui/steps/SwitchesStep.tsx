import { Button, Switch, Card, CardContent } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

export function SwitchesStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()
  const sw = state.switches || {}

  const toggle = (key: keyof NonNullable<WizardState["switches"]>) => {
    update((p) => ({
      ...p,
      switches: {
        ...p.switches,
        [key]: !p.switches?.[key],
      },
    }))
  }

  const items: { key: keyof NonNullable<WizardState["switches"]>; label: string }[] = [
    { key: "discountsEnabled", label: t("setup.enableDiscounts") },
    { key: "shiftsEnabled", label: t("setup.enableShifts") },
    { key: "repairsEnabled", label: t("setup.enableRepairs") },
    { key: "customerCreditEnabled", label: t("setup.enableCredit") },
    { key: "bonusEnabled", label: t("setup.enableBonus") },
    { key: "receiptPrintingEnabled", label: t("setup.enablePrinting") },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.switchesTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.switchesSubtitle")}</p>
      </div>

      <div className="space-y-3">
        {items.map(({ key, label }) => {
          const checked = !!sw[key]
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all border ${
                checked ? "border-primary/50 bg-primary/5" : "border-border"
              }`}
              onClick={() => toggle(key)}
            >
              <CardContent className="p-3.5 flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <Switch checked={checked} onCheckedChange={() => toggle(key)} />
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
