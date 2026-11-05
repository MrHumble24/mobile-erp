import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { usePriceLevels } from "@/entities/pricing"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import type { CustomerFormValues } from "../model/customer-form.schema"

/** Map a level code to its `pricing` i18n key; falls back to the server label. */
function levelKey(code: string): string | null {
  if (code === "RETAIL") return "pricing.levelRetail"
  if (code === "WHOLESALE") return "pricing.levelWholesale"
  if (code === "PARTNER") return "pricing.levelPartner"
  return null
}

export function CustomerFormFields({
  form,
}: {
  form: UseFormReturn<CustomerFormValues>
}) {
  const { t } = useI18n()
  const { data: levels } = usePriceLevels()
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customers.name")}</FormLabel>
            <FormControl>
              <Input placeholder="Ali Valiyev" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customers.phone")}</FormLabel>
            <FormControl>
              <Input placeholder="+998901234567" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="priceLevelCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pricing.customerType")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(levels ?? []).map((l) => {
                    const key = levelKey(l.code)
                    return (
                      <SelectItem key={l.code} value={l.code}>
                        {key ? t(key) : l.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="standingDiscountPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pricing.standingDiscount")}</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={100} step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customers.notes")}</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder={t("customers.notesPlaceholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
