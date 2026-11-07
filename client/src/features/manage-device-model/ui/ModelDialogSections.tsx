import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import type { DeviceModelFormValues } from "../model/device-model-form.schema"

type FormApi = UseFormReturn<DeviceModelFormValues>

export function ModelTextField({
  form,
  name,
  label,
}: {
  form: FormApi
  name: "brand" | "name"
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CustomsCodeField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="customsCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("inventory.customsCode")}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} className="font-mono" />
          </FormControl>
          <FormDescription>{t("inventory.customsCodeHint")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ActiveField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="isActive"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-[12px] border border-border bg-muted p-3">
          <FormLabel className="mb-0">{t("inventory.modelActive")}</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

/** A collapsed disclosure: a one-tap-away group, same shape everywhere. */
export function ExpandableSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <details className="group rounded-[12px] border border-border bg-muted px-3">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 pb-3">{children}</div>
    </details>
  )
}

/** The never-needed-at-keying fields, one tap away (`common.optional`). */
export function OptionalSection({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return <ExpandableSection label={t("common.optional")}>{children}</ExpandableSection>
}

