import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime } from "@/shared/lib/format"
import { differenceKind } from "../lib/shift-difference"
import { shiftTypeLabel, shiftAccountLabel } from "../lib/shift-labels"
import type { ShiftReportView as Report } from "../model/shift.types"

function Line({
  label,
  value,
  strong,
  className,
}: {
  label: string
  value: string
  strong?: boolean
  className?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-black/70">{label}</span>
      <span className={`font-mono ${strong ? "font-bold" : ""} ${className ?? ""}`}>{value}</span>
    </div>
  )
}

function differenceClass(difference: string): string {
  const kind = differenceKind(difference)
  if (kind === "short") return "text-[#d92d20]"
  if (kind === "over") return "text-[#027a48]"
  return "text-black/70"
}

function CashSummary({ report }: { report: Report }) {
  const { t } = useI18n()
  const open = report.closedAt === null
  return (
    <div className="space-y-1 border-b-2 border-dashed border-black/30 pb-2.5 text-[12px]">
      <Line label={t("shifts.openingCash")} value={formatMoney(report.openingCount)} />
      <Line label={t("shifts.expectedCash")} value={formatMoney(report.expectedCash)} strong />
      {!open && report.countedCash !== null && (
        <Line label={t("shifts.countedCash")} value={formatMoney(report.countedCash)} strong />
      )}
      {!open && report.difference !== null && (
        <Line
          label={t("shifts.difference")}
          value={formatMoney(report.difference)}
          strong
          className={differenceClass(report.difference)}
        />
      )}
      <Line label={t("shifts.cardTotal")} value={formatMoney(report.cardTotal)} />
    </div>
  )
}

function TypeGroups({ report }: { report: Report }) {
  const { t } = useI18n()
  if (report.byType.length === 0) {
    return <p className="py-1 text-center text-[11px] text-black/50">{t("shifts.noMovements")}</p>
  }
  return (
    <div className="space-y-2 border-b-2 border-dashed border-black/30 pb-2.5 text-[12px]">
      <p className="font-semibold uppercase tracking-wide text-[11px] text-black/60">
        {t("shifts.movements")}
      </p>
      {report.byType.map((group) => (
        <div key={group.typeCode} className="space-y-0.5">
          <Line
            label={`${shiftTypeLabel(group.typeCode, t)} (${group.count})`}
            value={formatMoney(group.total)}
            strong
          />
          {group.byAccount.map((a) => (
            <div
              key={a.accountCode}
              className="flex items-baseline justify-between gap-3 pl-3 text-[11px] text-black/55"
            >
              <span>{shiftAccountLabel(a.accountCode, t)}</span>
              <span className="font-mono">{formatMoney(a.total)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function AccountGroups({ report }: { report: Report }) {
  const { t } = useI18n()
  if (report.byAccount.length === 0) return null
  return (
    <div className="space-y-1 text-[12px]">
      <p className="font-semibold uppercase tracking-wide text-[11px] text-black/60">
        {t("shifts.byAccount")}
      </p>
      {report.byAccount.map((a) => (
        <div key={a.accountCode} className="flex items-baseline justify-between gap-2">
          <span className="text-black/70">{shiftAccountLabel(a.accountCode, t)}</span>
          <span className="font-mono text-[11px]">
            <span className="text-[#027a48]">+{formatMoney(a.in)}</span>
            {" / "}
            <span className="text-[#d92d20]">-{formatMoney(a.out)}</span>
            {" = "}
            <span className="font-semibold">{formatMoney(a.net)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

/** The printable shift report (ADR 0036), styled as a till paper so the shop's
 *  thermal printer can reuse the receipt print path (`.printable-cheque`). */
export function ShiftReportView({ report }: { report: Report }) {
  const { t } = useI18n()
  const open = report.closedAt === null
  return (
    <div className="printable-cheque w-full max-w-[340px] rounded-[8px] border border-[#d4d4d4] bg-white p-4 font-sans text-[12px] leading-snug text-black shadow-[var(--shadow-md)] print:border-none print:p-0 print:shadow-none">
      <div className="space-y-0.5 border-b-2 border-dashed border-black/30 pb-2.5 text-center">
        <p className="text-sm font-black uppercase tracking-wider">{t("shifts.report")}</p>
        <p className="text-[12px] font-semibold">{report.cashier.name}</p>
        {open && (
          <p className="text-[11px] font-semibold uppercase text-[#b54708]">{t("shifts.stillOpen")}</p>
        )}
      </div>

      <div className="space-y-1 border-b-2 border-dashed border-black/30 py-2.5 text-[12px]">
        <Line label={t("shifts.openedAt")} value={formatDateTime(report.openedAt)} />
        <Line label={t("shifts.closedAt")} value={open ? t("shifts.stillOpen") : formatDateTime(report.closedAt)} />
      </div>

      <div className="py-2.5">
        <CashSummary report={report} />
      </div>

      <TypeGroups report={report} />

      <div className="pt-2.5">
        <AccountGroups report={report} />
      </div>

      {report.note && (
        <p className="mt-2.5 border-t-2 border-dashed border-black/30 pt-2 text-[11px] text-black/70">
          {t("shifts.note")}: {report.note}
        </p>
      )}
    </div>
  )
}
