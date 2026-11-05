import { Switch } from "@/shared/ui/switch"
import { FormControl, FormField, FormItem, FormLabel } from "@/shared/ui/form"
import type { BooleanFieldName, SettingsForm } from "../model/settings-form.types"

/** A boolean switch bound to a form field. */
export function SwitchField({
  form,
  name,
  label,
  disabled,
}: {
  form: SettingsForm
  name: BooleanFieldName
  label: string
  disabled: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-3 space-y-0">
          <FormLabel className="text-xs font-semibold">{label}</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
