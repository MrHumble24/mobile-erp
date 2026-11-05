import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { SettingsForm, StringFieldName } from "../model/settings-form.types"

type FieldType = "text" | "number" | "time" | "textarea"

export function Field({
  form,
  name,
  label,
  type = "text",
  disabled,
  placeholder,
}: {
  form: SettingsForm
  name: StringFieldName
  label: string
  type?: FieldType
  disabled: boolean
  placeholder?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold">{label}</FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea {...field} disabled={disabled} placeholder={placeholder} />
            ) : (
              <Input
                {...field}
                type={type === "number" ? "number" : type === "time" ? "time" : "text"}
                disabled={disabled}
                placeholder={placeholder}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
