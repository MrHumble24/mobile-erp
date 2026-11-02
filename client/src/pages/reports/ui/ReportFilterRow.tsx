import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { RANGE_PRESETS, type ReportRange } from "../model/use-report-range"

export function ReportFilterRow({ range }: { range: ReportRange }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label>{t("reports.period")}</Label>
        <Select
          value={range.preset}
          onValueChange={(v) => range.setPreset(v as (typeof RANGE_PRESETS)[number])}
        >
          <SelectTrigger className="h-10 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_PRESETS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`reports.preset_${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {range.preset === "custom" && (
        <>
          <div className="space-y-1">
            <Label>{t("reports.dateFrom")}</Label>
            <Input
              type="date"
              value={range.fromDate}
              onChange={(e) => range.setFromDate(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("reports.dateTo")}</Label>
            <Input
              type="date"
              value={range.toDate}
              onChange={(e) => range.setToDate(e.target.value)}
              className="h-10"
            />
          </div>
        </>
      )}
    </div>
  )
}
