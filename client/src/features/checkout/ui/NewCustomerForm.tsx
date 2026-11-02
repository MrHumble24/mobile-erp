import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { newCustomerSchema, toFullPhone, type NewCustomerValues } from "../model/new-customer.schema"
import type { CartCustomer } from "../model/cart.store"

export interface NewCustomerFormProps {
  onAdd: (customer: CartCustomer) => void
}

function NameField({ form }: { form: UseFormReturn<NewCustomerValues> }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{t("pos.customerName")}</FormLabel>
          <FormControl>
            <Input placeholder={t("pos.customerName")} className="h-10" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PhoneField({ form }: { form: UseFormReturn<NewCustomerValues> }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{t("pos.customerPhone")}</FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono shrink-0">+998</span>
              <Input inputMode="numeric" maxLength={9} placeholder={t("pos.phoneHint")} className="h-10" {...field} />
            </div>
          </FormControl>
          <FormMessage>{form.formState.errors.phone && t("pos.phoneInvalid")}</FormMessage>
        </FormItem>
      )}
    />
  )
}

export function NewCustomerForm({ onAdd }: NewCustomerFormProps) {
  const { t } = useI18n()
  const form = useForm<NewCustomerValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: { name: "", phone: "" },
  })

  const onSubmit = (values: NewCustomerValues) => {
    onAdd({ name: values.name.trim(), phone: toFullPhone(values.phone) })
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <NameField form={form} />
        <PhoneField form={form} />
        <Button type="submit" variant="secondary" size="sm" className="w-full">
          {t("pos.useCustomer")}
        </Button>
      </form>
    </Form>
  )
}
