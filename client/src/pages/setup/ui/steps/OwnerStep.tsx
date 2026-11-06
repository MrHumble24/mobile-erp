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

export function OwnerStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()
  const [error, setError] = useState("")

  const handleNext = () => {
    if (!state.owner.firstName.trim()) {
      setError(t("setup.errorRequired"))
      return
    }
    if (!state.owner.email.trim() || !state.owner.email.includes("@")) {
      setError(t("setup.errorRequired"))
      return
    }
    if (!state.owner.password || state.owner.password.length < 8) {
      setError(t("setup.errorRequired"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.ownerTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.ownerSubtitle")}</p>
      </div>

      {error && <div className="text-xs text-destructive font-medium">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">{t("setup.firstName")} *</label>
          <Input
            value={state.owner.firstName}
            onChange={(e) =>
              update((p) => ({ ...p, owner: { ...p.owner, firstName: e.target.value } }))
            }
            placeholder="Alex"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">{t("setup.lastName")}</label>
          <Input
            value={state.owner.lastName || ""}
            onChange={(e) =>
              update((p) => ({ ...p, owner: { ...p.owner, lastName: e.target.value } }))
            }
            placeholder="Smith"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.email")} *</label>
        <Input
          type="email"
          value={state.owner.email}
          onChange={(e) =>
            update((p) => ({ ...p, owner: { ...p.owner, email: e.target.value } }))
          }
          placeholder="owner@shop.uz"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.password")} *</label>
        <Input
          type="password"
          value={state.owner.password}
          onChange={(e) =>
            update((p) => ({ ...p, owner: { ...p.owner, password: e.target.value } }))
          }
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.phone")}</label>
        <Input
          value={state.owner.phone || ""}
          onChange={(e) =>
            update((p) => ({ ...p, owner: { ...p.owner, phone: e.target.value } }))
          }
          placeholder="+998 90 123 45 67"
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
