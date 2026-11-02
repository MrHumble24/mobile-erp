import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import type { LookupView } from "@/entities/qc"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { GradeDeviceValues } from "../model/grade-device.schema"

type Form = UseFormReturn<GradeDeviceValues>

function GradeField({ form, grades }: { form: Form; grades: LookupView[] }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="gradeCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("qc.grade")}</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="h-10"><SelectValue placeholder={t("qc.selectGrade")} /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {grades.map((g) => (
                <SelectItem key={g.code} value={g.code}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function BatteryField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="batteryHealth"
      render={({ field }) => {
        const pct = Math.max(0, Math.min(100, Number(field.value) || 0))
        return (
          <FormItem>
            <FormLabel>{t("qc.batteryHealth")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-10"
                value={field.value}
                onChange={(e) => field.onChange(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
              />
            </FormControl>
            <div className="h-2 rounded-full bg-[#eeeeee] overflow-hidden">
              <div
                className={pct < 80 ? "h-full bg-amber-500" : "h-full bg-emerald-500"}
                style={{ width: `${pct}%` }}
              />
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

function CostField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="repairCost"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("qc.repairCostEstimate")}</FormLabel>
          <FormControl>
            <Input type="number" min={0} className="h-10" {...field} />
          </FormControl>
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
            <Textarea className="min-h-16 py-2 px-3 text-sm" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function QcFields({ form, grades, canViewCost }: { form: Form; grades: LookupView[]; canViewCost: boolean }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <GradeField form={form} grades={grades} />
        <BatteryField form={form} />
      </div>
      {canViewCost && <CostField form={form} />}
      <NotesField form={form} />
    </div>
  )
}
