import { useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import type { SettingsForm } from "../model/settings-form.types"
import { Field } from "./Field"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export function BonusSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  const enabled = useWatch({ control: form.control, name: "bonusEnabled" })

  return (
    <Section
      title={t("settings.sectionBonus")}
      description={t("settings.sectionBonusDesc")}
    >
      <SwitchField
        form={form}
        name="bonusEnabled"
        label={t("settings.bonusEnabled")}
        disabled={disabled}
      />
      {enabled && (
        <>
          <Field
            form={form}
            name="bonusEarnPercent"
            label={t("settings.bonusEarnPercent")}
            type="number"
            suffix="%"
            disabled={disabled}
          />
          <Field
            form={form}
            name="bonusMaxRedeemPercent"
            label={t("settings.bonusMaxRedeemPercent")}
            type="number"
            suffix="%"
            disabled={disabled}
          />
        </>
      )}
    </Section>
  )
}
