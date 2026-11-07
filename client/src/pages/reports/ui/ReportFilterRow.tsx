import { Calendar } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RANGE_PRESETS, type ReportRange } from "../model/use-report-range"

export function ReportFilterRow({ range }: { range: ReportRange }) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[16px] border border-border bg-card p-3 shadow-[var(--shadow-xs)]">
      {/* Quick preset buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {RANGE_PRESETS.map((p) => {
          const isActive = range.preset === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => range.setPreset(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t(`reports.preset_${p}`)}
            </button>
          )
        })}
      </div>

      {/* Date display & Custom range inputs */}
      <div className="flex flex-wrap items-center gap-2">
        {range.preset === "custom" ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground sr-only">{t("reports.dateFrom")}</Label>
              <Input
                type="date"
                value={range.fromDate}
                onChange={(e) => range.setFromDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <span className="text-xs text-muted-foreground">—</span>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground sr-only">{t("reports.dateTo")}</Label>
              <Input
                type="date"
                value={range.toDate}
                onChange={(e) => range.setToDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <Calendar className="size-3.5 text-primary" />
            <span className="font-mono text-[11px]">
              {range.fromDate ? formatDate(range.fromDate) : "—"}
              {" — "}
              {range.toDate ? formatDate(range.toDate) : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
