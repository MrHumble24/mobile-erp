import { useI18n } from "@/shared/i18n"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"
import type { LookupView } from "@/entities/qc"

export function DefectsChecklist({
  defectTypes,
  selectedCodes,
  onToggle,
}: {
  defectTypes: LookupView[]
  selectedCodes: string[]
  onToggle: (code: string) => void
}) {
  const { t } = useI18n()
  if (defectTypes.length === 0) return null

  return (
    <div className="space-y-2">
      <Label>{t("qc.defects")}</Label>
      <div className="grid grid-cols-2 gap-2 border border-[#e8e8e8] rounded-[12px] bg-[#f8f9fa] p-3 max-h-36 overflow-y-auto">
        {defectTypes.map((d) => {
          const isChecked = selectedCodes.includes(d.code)
          return (
            <label
              key={d.code}
              className="flex items-center gap-2 text-xs font-medium cursor-pointer"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(d.code)}
              />
              <span>{d.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
