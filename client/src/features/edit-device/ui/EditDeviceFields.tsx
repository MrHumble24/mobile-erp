import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  DynamicSpecFields,
  type AttributeDef,
  type SpecFieldProblem,
} from "@/entities/device-model"
import { Input } from "@/shared/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { EditDeviceValues } from "../model/edit-device.schema"

type Form = UseFormReturn<EditDeviceValues>

export function EditDeviceFields({
  form,
  attributes,
  problems,
}: {
  form: Form
  attributes: AttributeDef[]
  problems: SpecFieldProblem[]
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <DynamicSpecFields
        attributes={attributes}
        control={form.control}
        name="specs"
        problems={problems}
      />
      <FormField
        control={form.control}
        name="targetPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("inventory.targetPrice")}</FormLabel>
            <FormControl>
              <Input type="number" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
