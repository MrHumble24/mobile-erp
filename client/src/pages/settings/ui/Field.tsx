import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { cn } from "@/shared/lib/utils"
import type { SettingsForm, StringFieldName } from "../model/settings-form.types"

type FieldType = "text" | "number" | "time" | "textarea"

/** Apple Inset Group row for text and number inputs. */
export function Field({
  form,
  name,
  label,
  description,
  type = "text",
  disabled,
  placeholder,
  suffix,
  className,
}: {
  form: SettingsForm
  name: StringFieldName
  label: string
  description?: string
  type?: FieldType
  disabled: boolean
  placeholder?: string
  suffix?: string
  className?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "p-3.5 sm:px-4 sm:py-3 space-y-1.5 transition-colors hover:bg-muted/15",
            className,
          )}
        >
          {type === "textarea" ? (
            <>
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium text-foreground">
                  {label}
                </FormLabel>
                {description && (
                  <FormDescription className="text-xs text-muted-foreground">
                    {description}
                  </FormDescription>
                )}
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={disabled}
                  placeholder={placeholder}
                  className="min-h-[80px] text-sm"
                />
              </FormControl>
              <FormMessage />
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 pr-2">
                <FormLabel className="text-sm font-medium text-foreground">
                  {label}
                </FormLabel>
                {description && (
                  <FormDescription className="text-xs text-muted-foreground leading-normal">
                    {description}
                  </FormDescription>
                )}
              </div>
              <div className="flex items-center gap-2 sm:w-60 shrink-0">
                <FormControl>
                  <Input
                    {...field}
                    type={
                      type === "number"
                        ? "number"
                        : type === "time"
                          ? "time"
                          : "text"
                    }
                    disabled={disabled}
                    placeholder={placeholder}
                    className="h-9 text-sm"
                  />
                </FormControl>
                {suffix && (
                  <span className="text-xs text-muted-foreground shrink-0 font-medium">
                    {suffix}
                  </span>
                )}
              </div>
              <FormMessage />
            </div>
          )}
        </FormItem>
      )}
    />
  )
}
