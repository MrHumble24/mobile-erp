import type { UseFormReturn } from "react-hook-form"
import { useFieldArray, useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import type { LookupView } from "@/entities/qc"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { GradeDeviceValues } from "../model/grade-device.schema"

type Form = UseFormReturn<GradeDeviceValues>

function DefectRow({ form, index, label }: { form: Form; index: number; label: string }) {
  const { t } = useI18n()
  const id = `defect-${index}`
  const selected = useWatch({
    control: form.control,
    name: `defects.${index}.selected`,
  })

  const handleToggle = (checked: boolean) => {
    form.setValue(`defects.${index}.selected`, checked, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Checkbox
          id={id}
          checked={Boolean(selected)}
          onCheckedChange={(val) => handleToggle(Boolean(val))}
        />
        <label htmlFor={id} className="cursor-pointer select-none text-xs sm:text-sm text-foreground">
          {label}
        </label>
      </div>
      {selected && (
        <Input
          className="h-9 text-xs"
          placeholder={t("qc.defectNotes")}
          {...form.register(`defects.${index}.notes`)}
        />
      )}
    </div>
  )
}

export function DefectsChecklist({ form, defectTypes }: { form: Form; defectTypes: LookupView[] }) {
  const { t } = useI18n()
  const { fields } = useFieldArray({ control: form.control, name: "defects" })
  const error = form.formState.errors.defects as { message?: string; root?: { message?: string } } | undefined
  const hasError = Boolean(error?.message || error?.root?.message)

  if (fields.length === 0) return null

  return (
    <div className="space-y-2">
      <Label className={hasError ? "text-destructive" : undefined}>{t("qc.defects")}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 border border-border rounded-[12px] bg-muted p-3 max-h-60 overflow-y-auto">
        {fields.map((f, i) => (
          <DefectRow key={f.id} form={form} index={i} label={defectTypes[i]?.label ?? f.defectCode} />
        ))}
      </div>
      {hasError && <p className="text-xs font-medium text-destructive">{t("qc.failNeedsDefect")}</p>}
    </div>
  )
}
