import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { EditShipmentValues } from "../model/edit-shipment.schema"

type Form = UseFormReturn<EditShipmentValues>

function DateCountRow({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        control={form.control}
        name="shipmentDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("shipments.shipmentDate")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="expectedCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("shipments.expectedCount")}</FormLabel>
            <FormControl>
              <Input type="number" min={1} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function OverheadField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="overheadCost"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("shipments.overheadCost")}</FormLabel>
          <FormControl>
            <Input type="number" min={0} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormDescription>{t("shipments.overheadRespreadHint")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function NotesField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("common.notes")}</FormLabel>
          <FormControl>
            <Textarea rows={2} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function EditShipmentFields({ form, canViewCost }: { form: Form; canViewCost: boolean }) {
  return (
    <div className="space-y-4">
      <DateCountRow form={form} />
      {canViewCost && <OverheadField form={form} />}
      <NotesField form={form} />
    </div>
  )
}
