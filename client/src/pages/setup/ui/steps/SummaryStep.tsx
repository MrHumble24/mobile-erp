import { useState } from "react"
import { AlertCircle, Clock } from "lucide-react"
import { Button, Input, Card, CardContent } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import { usePerformSetup } from "@/entities/company"
import { useAuthStore } from "@/features/auth"
import type { WizardState, WizardUpdate } from "./types"
import { buildSetupPayload } from "../../model/setup-payload"

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
  const [isRateLimited, setIsRateLimited] = useState(false)

  const handleFinish = () => {
    if (!state.code || state.code.trim().length < 8) {
      setError(t("setup.errorInvalidCode") || "Invalid setup code. Enter the code from server logs.")
      return
    }
    setError("")
    setIsRateLimited(false)

    const payload = buildSetupPayload(state)

    performSetup.mutate(payload, {
      onSuccess: (res) => {
        useAuthStore.getState().setSession(res.accessToken, res.user)
        onSuccess()
      },
      onError: (err: unknown) => {
        const errorObj = err as { status?: number; statusCode?: number; message?: string }
        const status = errorObj?.status ?? errorObj?.statusCode
        const msg = errorObj?.message || ""

        if (
          status === 429 ||
          msg.toLowerCase().includes("too many") ||
          msg.toLowerCase().includes("wait")
        ) {
          setIsRateLimited(true)
          setError(
            t("setup.errorRateLimited") ||
              "Too many invalid setup code attempts. Please wait 15 minutes before trying again."
          )
        } else if (msg.toLowerCase().includes("invalid setup code") || status === 400) {
          setError(
            t("setup.errorInvalidCode") ||
              "Invalid setup code. Please check the code in server startup logs."
          )
        } else {
          setError(msg || t("setup.errorInvalidCode"))
        }
      },
    })
  }

  const branchName = state.firstStore.name?.trim() || state.company.name

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.summaryTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.summarySubtitle")}</p>
      </div>

      {error && (
        <div
          role="alert"
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm font-medium ${
            isRateLimited
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {isRateLimited ? (
            <Clock className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
          )}
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      <Card className="border-border">
        <CardContent className="p-4 space-y-3 divide-y divide-border">
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-muted-foreground">{t("setup.summaryOwner")}:</span>
            <span className="font-semibold">
              {state.owner.firstName} ({state.owner.email})
            </span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">{t("setup.shopName") || "Shop Name"}:</span>
            <span className="font-semibold">{state.company.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">{t("setup.branchName") || "First Branch"}:</span>
            <span className="font-semibold">{branchName}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">{t("setup.summaryCurrency")}:</span>
            <span className="font-semibold">
              {state.company.currencyCode} ({state.company.currencySign})
            </span>
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
          onChange={(e) => {
            setError("")
            setIsRateLimited(false)
            update((p) => ({ ...p, code: e.target.value.toUpperCase() }))
          }}
          placeholder={t("setup.setupCodePlaceholder")}
          className={`uppercase tracking-widest font-mono text-center text-lg h-11 ${
            error ? "border-destructive focus-visible:ring-destructive" : ""
          }`}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={performSetup.isPending}
          className="h-10 rounded-full px-6"
        >
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