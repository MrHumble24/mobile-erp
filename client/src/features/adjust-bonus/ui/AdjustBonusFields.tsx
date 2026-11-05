import { useWatch, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import type { AdjustBonusValues } from "../model/adjust-bonus.schema"

export function AdjustBonusFields({ form }: { form: UseFormReturn<AdjustBonusValues> }) {
  const { t } = useI18n()
  // useWatch, not form.watch: the React Compiler memoises this component.
  const amount = useWatch({ control: form.control, name: "amount" })

  return (
    <>
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customers.bonusAmount")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder={t("customers.bonusAmountPlaceholder")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {Number(amount) < 0 && (
        <p className="text-xs text-[#e53935]">{t("customers.bonusAdjustNegative")}</p>
      )}
      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customers.bonusReason")}</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder={t("customers.bonusReasonPlaceholder")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
