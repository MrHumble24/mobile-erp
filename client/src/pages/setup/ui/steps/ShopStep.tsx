import { useState } from "react"
import { Button, Input } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

export function ShopStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()
  const [error, setError] = useState("")

  const handleNext = () => {
    if (!state.company.name.trim()) {
      setError(t("setup.errorRequired"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.shopTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.shopSubtitle")}</p>
      </div>

      {error && <div className="text-xs text-destructive font-medium">{error}</div>}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.shopName")} *</label>
        <Input
          value={state.company.name}
          onChange={(e) =>
            update((p) => ({
              ...p,
              company: { ...p.company, name: e.target.value },
              firstStore: { ...p.firstStore, name: e.target.value },
            }))
          }
          placeholder="e.g. My Phone Shop"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.legalName")}</label>
        <Input
          value={state.company.legalName || ""}
          onChange={(e) =>
            update((p) => ({ ...p, company: { ...p.company, legalName: e.target.value } }))
          }
          placeholder="e.g. My Phone Shop MCHJ"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.shopAddress")}</label>
        <Input
          value={state.company.address || ""}
          onChange={(e) =>
            update((p) => ({
              ...p,
              company: { ...p.company, address: e.target.value },
              firstStore: { ...p.firstStore, address: e.target.value },
            }))
          }
          placeholder="Tashkent, Shaykhontohur"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.shopPhone")}</label>
        <Input
          value={state.company.phone || ""}
          onChange={(e) =>
            update((p) => ({
              ...p,
              company: { ...p.company, phone: e.target.value },
              firstStore: { ...p.firstStore, phone: e.target.value },
            }))
          }
          placeholder="+998 71 200 00 00"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="h-10 rounded-full px-6">
          {t("setup.back")}
        </Button>
        <Button onClick={handleNext} className="h-10 rounded-full px-6 font-semibold shadow-xs">
          {t("setup.next")}
        </Button>
      </div>
    </div>
  )
}
