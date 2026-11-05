import { useI18n } from "@/shared/i18n"
import type { SettingsForm } from "../model/settings-form.types"
import { Field } from "./Field"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export function BonusSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  const enabled = form.watch("bonusEnabled")

  return (
    <Section title={t("settings.sectionBonus")} description={t("settings.sectionBonusDesc")}>
      <SwitchField
        form={form}
        name="bonusEnabled"
        label={t("settings.bonusEnabled")}
        disabled={disabled}
      />
      {enabled && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            form={form}
            name="bonusEarnPercent"
            label={t("settings.bonusEarnPercent")}
            type="number"
            disabled={disabled}
          />
          <Field
            form={form}
            name="bonusMaxRedeemPercent"
            label={t("settings.bonusMaxRedeemPercent")}
            type="number"
            disabled={disabled}
          />
        </div>
      )}
    </Section>
  )
}
