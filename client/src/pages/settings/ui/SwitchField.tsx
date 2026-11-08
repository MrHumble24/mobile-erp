import { Switch } from "@/shared/ui/switch"
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/shared/ui/form"
import type { BooleanFieldName, SettingsForm } from "../model/settings-form.types"

/** A boolean switch bound to a form field with Apple Inset Group styling. */
export function SwitchField({
  form,
  name,
  label,
  description,
  disabled,
}: {
  form: SettingsForm
  name: BooleanFieldName
  label: string
  description?: string
  disabled: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 p-3.5 sm:px-4 sm:py-3 space-y-0 transition-colors hover:bg-muted/15">
          <div className="space-y-0.5 min-w-0 pr-2">
            <FormLabel className="text-sm font-medium text-foreground cursor-pointer block">
              {label}
            </FormLabel>
            {description && (
              <FormDescription className="text-xs text-muted-foreground leading-normal">
                {description}
              </FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
