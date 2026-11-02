import { useFieldArray, type UseFormReturn } from "react-hook-form"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import type { DeviceModelFormValues } from "../model/device-model-form.schema"
import { AttributeRow } from "./AttributeRow"

/** Spec-schema editor section of the model dialog. */
export function AttributeEditor({
  form,
  savedKeys,
}: {
  form: UseFormReturn<DeviceModelFormValues>
  savedKeys: Set<string>
}) {
  const { t } = useI18n()
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "attributes",
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {t("inventory.attrSectionTitle")}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ key: "", label: "", type: "text", options: [], required: false })
          }
        >
          <Plus className="size-4" />
          {t("inventory.attrAdd")}
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <AttributeRow
            key={field.id}
            form={form}
            index={index}
            keyEditable={!savedKeys.has(field.key)}
            isFirst={index === 0}
            isLast={index === fields.length - 1}
            onMoveUp={() => move(index, index - 1)}
            onMoveDown={() => move(index, index + 1)}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
    </div>
  )
}
