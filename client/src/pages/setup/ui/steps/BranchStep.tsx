import { Button, Input } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

export function BranchStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()

  const branchName = state.firstStore?.name || state.company.name
  const branchAddress = state.firstStore?.address || state.company.address || ""
  const branchPhone = state.firstStore?.phone || state.company.phone || ""

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.branchTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.branchSubtitle")}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.branchName")}</label>
        <Input
          value={branchName}
          onChange={(e) =>
            update((p) => ({ ...p, firstStore: { ...p.firstStore, name: e.target.value } }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.branchAddress")}</label>
        <Input
          value={branchAddress}
          onChange={(e) =>
            update((p) => ({ ...p, firstStore: { ...p.firstStore, address: e.target.value } }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.branchPhone")}</label>
        <Input
          value={branchPhone}
          onChange={(e) =>
            update((p) => ({ ...p, firstStore: { ...p.firstStore, phone: e.target.value } }))
          }
        />
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
