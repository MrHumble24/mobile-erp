import { useI18n } from "@/shared/i18n"
import type { SettingsForm } from "../model/settings-form.types"
import { Field } from "./Field"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export function DiscountsSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("pricing.settingsTitle")}
      description={t("pricing.standingDiscountHint")}
      footer={t("pricing.settingsPresetsHint")}
    >
      <SwitchField
        form={form}
        name="discountsEnabled"
        label={t("pricing.settingsEnabled")}
        disabled={disabled}
      />
      <SwitchField
        form={form}
        name="discountPercentAllowed"
        label={t("pricing.settingsPercent")}
        disabled={disabled}
      />
      <SwitchField
        form={form}
        name="discountAmountAllowed"
        label={t("pricing.settingsAmount")}
        disabled={disabled}
      />
      <Field
        form={form}
        name="maxDiscountPercent"
        label={t("pricing.settingsMax")}
        type="number"
        suffix="%"
        disabled={disabled}
      />
      <Field
        form={form}
        name="discountPresetsPercent"
        label={t("pricing.settingsPresetsPercent")}
        disabled={disabled}
        placeholder="3, 5, 10"
      />
      <Field
        form={form}
        name="discountPresetsAmount"
        label={t("pricing.settingsPresetsAmount")}
        disabled={disabled}
        placeholder="50000, 100000"
      />
    </Section>
  )
}

