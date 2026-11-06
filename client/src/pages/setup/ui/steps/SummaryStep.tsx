import { useState } from "react"
import { Button, Input, Card, CardContent } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import { usePerformSetup } from "@/entities/company"
import { useAuthStore } from "@/features/auth"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onBack: () => void
  onSuccess: () => void
}

export function SummaryStep({ state, update, onBack, onSuccess }: Props) {
  const { t } = useI18n()
  const performSetup = usePerformSetup()
  const [error, setError] = useState("")

  const handleFinish = () => {
    if (!state.code || state.code.trim().length < 4) {
      setError(t("setup.errorInvalidCode"))
      return
    }
    setError("")

    performSetup.mutate(state, {
      onSuccess: (res) => {
        useAuthStore.getState().setSession(res.accessToken, res.user)
        onSuccess()
      },
      onError: (err: Error) => {
        setError(err.message || t("setup.errorInvalidCode"))
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.summaryTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.summarySubtitle")}</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-4 space-y-3 divide-y divide-border">
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-muted-foreground">{t("setup.summaryOwner")}:</span>
            <span className="font-semibold">{state.owner.firstName} ({state.owner.email})</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">{t("setup.summaryShop")}:</span>
            <span className="font-semibold">{state.company.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">{t("setup.summaryCurrency")}:</span>
            <span className="font-semibold">{state.company.currencyCode} ({state.company.currencySign})</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">{t("setup.summaryTheme")}:</span>
            <span className="font-semibold capitalize">{state.company.themeCode || "caldera"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 p-4 rounded-xl border border-primary/30 bg-primary/5">
        <label className="text-xs font-semibold">{t("setup.setupCode")} *</label>
        <p className="text-xs text-muted-foreground">{t("setup.setupCodeDesc")}</p>
        <Input
          value={state.code}
          onChange={(e) => update((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
          placeholder={t("setup.setupCodePlaceholder")}
          className="uppercase tracking-widest font-mono text-center text-lg h-11"
        />
        {error && <div className="text-xs text-destructive font-medium pt-1">{error}</div>}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={performSetup.isPending} className="h-10 rounded-full px-6">
          {t("setup.back")}
        </Button>
        <Button
          onClick={handleFinish}
          disabled={performSetup.isPending}
          className="h-10 rounded-full px-8 font-semibold shadow-xs"
        >
          {performSetup.isPending ? t("setup.saving") : t("setup.finish")}
        </Button>
      </div>
    </div>
  )
}
