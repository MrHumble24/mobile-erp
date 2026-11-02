import type { UseFormReturn } from "react-hook-form"
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
import type { CustomerFormValues } from "../model/customer-form.schema"

export function CustomerFormFields({
  form,
}: {
  form: UseFormReturn<CustomerFormValues>
}) {
  const { t } = useI18n()
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
