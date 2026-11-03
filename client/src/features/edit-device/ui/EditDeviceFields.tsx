import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  DynamicSpecFields,
  type AttributeDef,
  type SpecFieldProblem,
} from "@/entities/device-model"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { EditDeviceValues } from "../model/edit-device.schema"

type Form = UseFormReturn<EditDeviceValues>

/** Dual-SIM toggle (form-only) revealing a required imei2 field when on. */
function DualSimSection({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <>
      <FormField
        control={form.control}
        name="dualSim"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t("inventory.dualSim")}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  if (!checked) form.setValue("imei2", "")
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      {form.watch("dualSim") && (
        <FormField
          control={form.control}
          name="imei2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("inventory.imei2")}</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder={t("inventory.imei2Hint")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  )
}

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
      <DualSimSection form={form} />
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
