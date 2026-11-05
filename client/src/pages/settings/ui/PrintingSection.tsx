import { useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { SettingsForm } from "../model/settings-form.types"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export function PrintingSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  // useWatch, not form.watch: the React Compiler memoises this component, so only a
  // subscription re-renders it when the switch changes.
  const receiptsEnabled = useWatch({ control: form.control, name: "receiptPrintingEnabled" })

  return (
    <Section title={t("settings.sectionPrinting")} description={t("settings.sectionPrintingDesc")}>
      <SwitchField
        form={form}
        name="receiptPrintingEnabled"
        label={t("settings.receiptPrintingEnabled")}
        disabled={disabled}
      />
      {receiptsEnabled && (
        <FormField
          control={form.control}
          name="receiptPaperWidthMm"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">
                {t("settings.receiptPaperWidth")}
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="58">{t("settings.paperWidth58")}</SelectItem>
                  <SelectItem value="80">{t("settings.paperWidth80")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <SwitchField
        form={form}
        name="priceTagsEnabled"
        label={t("settings.priceTagsEnabled")}
        disabled={disabled}
      />
    </Section>
  )
}
