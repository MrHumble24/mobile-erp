import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TimeZoneSelect,
} from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

export function CurrencyStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()

  const currencyPresets = [
    { code: "USD", sign: "$", position: "before", decimals: 2, label: "USD ($) - US Dollar" },
    { code: "UZS", sign: "so'm", position: "after", decimals: 0, label: "UZS (so'm) - O'zbek so'mi" },
    { code: "EUR", sign: "€", position: "before", decimals: 2, label: "EUR (€) - Euro" },
    { code: "RUB", sign: "₽", position: "after", decimals: 2, label: "RUB (₽) - Russian Ruble" },
  ]

  const applyPreset = (code: string) => {
    const p = currencyPresets.find((x) => x.code === code)
    if (!p) return
    update((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        currencyCode: p.code,
        currencySign: p.sign,
        currencySignPosition: p.position as "before" | "after",
        currencyDecimals: p.decimals,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.regionTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.regionSubtitle")}</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold">{t("setup.currencyCode")}</label>
        <Select
          value={state.company.currencyCode}
          onValueChange={(code) => {
            if (code) applyPreset(code)
          }}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Choose currency" />
          </SelectTrigger>
          <SelectContent>
            {currencyPresets.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">{t("setup.currencySign")}</label>
          <Input
            value={state.company.currencySign}
            onChange={(e) =>
              update((p) => ({ ...p, company: { ...p.company, currencySign: e.target.value } }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">{t("setup.signPosition")}</label>
          <Select
            value={state.company.currencySignPosition || "before"}
            onValueChange={(val) => {
              if (val === "before" || val === "after") {
                update((p) => ({ ...p, company: { ...p.company, currencySignPosition: val } }))
              }
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="before">{t("setup.signBefore")}</SelectItem>
              <SelectItem value="after">{t("setup.signAfter")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">{t("setup.decimals")}</label>
          <Select
            value={String(state.company.currencyDecimals ?? 2)}
            onValueChange={(val) => {
              if (val !== null) {
                update((p) => ({ ...p, company: { ...p.company, currencyDecimals: Number(val) } }))
              }
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("setup.decimalsZero")}</SelectItem>
              <SelectItem value="2">{t("setup.decimalsTwo")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">{t("setup.timeZone")}</label>
          <TimeZoneSelect
            value={state.company.timeZone || "Asia/Tashkent"}
            onChange={(tz) =>
              update((p) => ({ ...p, company: { ...p.company, timeZone: tz } }))
            }
          />
        </div>
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
