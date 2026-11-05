import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { type RegisterDeviceItem, type RegisteredDeviceView } from "@/entities/shipment"
import type { SpecFieldProblem } from "@/entities/device-model"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function specSummary(specs: Record<string, unknown>): string {
  const parts = Object.values(specs)
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "-"
}

function BatchRow({
  item,
  modelName,
  problems,
  onRemove,
}: {
  item: RegisterDeviceItem
  modelName: string
  problems?: SpecFieldProblem[]
  onRemove: () => void
}) {
  const { t } = useI18n()
  const hasError = problems !== undefined
  return (
    <>
      <TableRow className={hasError ? "bg-destructive/10" : undefined}>
        <TableCell className="font-mono text-xs">{unitCode(item)}</TableCell>
        <TableCell className="text-xs">{modelName}</TableCell>
        <TableCell className="text-xs">{specSummary(item.specs)}</TableCell>
        <TableCell className="text-xs font-semibold">{formatMoney(item.acquisitionCost)}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 text-xs text-destructive">
            {t("common.delete")}
          </Button>
        </TableCell>
      </TableRow>
      {problems && problems.length > 0 && (
        <TableRow className="bg-destructive/10">
          <TableCell colSpan={5} className="py-1 text-xs text-destructive">
            {problems.map((p) => `${p.key}: ${p.message}`).join("; ")}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function BatchTable({
  items,
  modelsMap,
  problemsByImei,
  onRemove,
}: {
  items: RegisterDeviceItem[]
  modelsMap: Record<string, string>
  problemsByImei: Record<string, SpecFieldProblem[]>
  onRemove: (index: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="border border-[#e8e8e8] rounded-[14px] bg-white max-h-48 overflow-y-auto shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("catalog.unitCode")}</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("shipments.specs")}</TableHead>
            <TableHead>{t("shipments.acquisitionCost")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, idx) => (
            <BatchRow
              key={unitCode(it)}
              item={it}
              modelName={modelsMap[it.modelId] || it.modelId}
              problems={problemsByImei[unitCode(it)]}
              onRemove={() => onRemove(idx)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function LandedResults({ results }: { results: RegisteredDeviceView[] }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1.5 rounded-[14px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
      <span className="text-xs font-semibold">{t("shipments.landedCostResults")}</span>
      {results.map((r) => (
        <div key={r.id} className="flex items-center justify-between text-xs">
          <span className="font-mono">{unitCode(r)}</span>
          <span className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {t("inventory.customsFee")}: {formatMoney(r.customsFee)}
            </span>
            <span className="font-semibold">{formatMoney(r.landedCost)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function DeviceBatchList({
  items,
  modelsMap,
  problemsByImei,
  registeredCount,
  expectedCount,
  results,
  canViewCost,
  isSubmitting,
  onRemove,
  onSubmit,
}: {
  items: RegisterDeviceItem[]
  modelsMap: Record<string, string>
  problemsByImei: Record<string, SpecFieldProblem[]>
  registeredCount: number
  expectedCount: number
  results: RegisteredDeviceView[]
  canViewCost: boolean
  isSubmitting: boolean
  onRemove: (index: number) => void
  onSubmit: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-3 pt-3 border-t border-[#e8e8e8]">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{t("shipments.deviceList")} ({items.length})</span>
        <span className="text-muted-foreground">
          {t("shipments.registeredProgress", { registered: registeredCount, expected: expectedCount })}
        </span>
      </div>
      {items.length > 0 && (
        <BatchTable items={items} modelsMap={modelsMap} problemsByImei={problemsByImei} onRemove={onRemove} />
      )}
      {canViewCost && results.length > 0 && <LandedResults results={results} />}
      <Button className="w-full" onClick={onSubmit} disabled={items.length === 0 || isSubmitting}>
        {isSubmitting ? t("common.loading") : `${t("shipments.submitBatch")} (${items.length})`}
      </Button>
    </div>
  )
}
