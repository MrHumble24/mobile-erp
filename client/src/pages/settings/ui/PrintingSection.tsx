import { useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { SettingsForm } from "../model/settings-form.types"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export function PrintingSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
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
            <FormItem className="p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 space-y-0">
              <FormLabel className="text-sm font-medium text-foreground">
                {t("settings.receiptPaperWidth")}
              </FormLabel>
              <div className="sm:w-60 shrink-0">
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="58">{t("settings.paperWidth58")}</SelectItem>
                    <SelectItem value="80">{t("settings.paperWidth80")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
