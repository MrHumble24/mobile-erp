import { useFieldArray, type UseFormReturn } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/ui/form"
import { emptyRow, type CreatePriceListValues } from "../model/create-price-list.schema"

type Form = UseFormReturn<CreatePriceListValues>

function RowInput({
  form,
  index,
  field,
  placeholder,
  type,
}: {
  form: Form
  index: number
  field: "customsCode" | "description" | "fee"
  placeholder: string
  type?: "number"
}) {
  return (
    <FormField
      control={form.control}
      name={`items.${index}.${field}` as const}
      render={({ field: f }) => (
        <FormItem className="flex-1">
          <FormControl>
            <Input
              {...f}
              value={f.value ?? ""}
              type={type}
              min={type === "number" ? 0 : undefined}
              placeholder={placeholder}
              className="h-9"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PriceListRowsField({ form }: { form: Form }) {
  const { t } = useI18n()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" })
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <span className="flex-1">{t("customs.customsCode")}</span>
        <span className="flex-1">{t("customs.description")}</span>
        <span className="flex-1">{t("customs.fee")}</span>
        <span className="w-9" />
      </div>
      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
        {fields.map((row, index) => (
          <div key={row.id} className="flex items-start gap-2">
            <RowInput form={form} index={index} field="customsCode" placeholder={t("customs.customsCode")} />
            <RowInput form={form} index={index} field="description" placeholder={t("customs.description")} />
            <RowInput form={form} index={index} field="fee" placeholder={t("customs.fee")} type="number" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-destructive"
              onClick={() => remove(index)}
              aria-label={t("customs.removeRow")}
              title={t("customs.removeRow")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => append(emptyRow())}>
        <Plus className="size-4" />
        {t("customs.addRow")}
      </Button>
    </div>
  )
}
