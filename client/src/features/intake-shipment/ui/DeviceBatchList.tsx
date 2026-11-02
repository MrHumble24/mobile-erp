import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { type RegisterDeviceItem, type RegisteredDeviceView } from "@/entities/shipment"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function BatchRow({
  item,
  modelName,
  hasError,
  onRemove,
}: {
  item: RegisterDeviceItem
  modelName: string
  hasError: boolean
  onRemove: () => void
}) {
  const { t } = useI18n()
  return (
    <TableRow className={hasError ? "bg-destructive/10" : undefined}>
      <TableCell className="font-mono text-xs">{item.imei}</TableCell>
      <TableCell className="text-xs">{modelName}</TableCell>
      <TableCell className="text-xs">{String(item.specs.storage || "-")}</TableCell>
      <TableCell className="text-xs font-semibold">{formatMoney(item.acquisitionCost)}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 text-xs text-destructive">
          {t("common.delete")}
        </Button>
      </TableCell>
    </TableRow>
  )
}

function BatchTable({
  items,
  modelsMap,
  errorImei,
  onRemove,
}: {
  items: RegisterDeviceItem[]
  modelsMap: Record<string, string>
  errorImei: string | null
  onRemove: (index: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="border border-[#e8e8e8] rounded-[14px] bg-white max-h-48 overflow-y-auto shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMEI</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("inventory.storage")}</TableHead>
            <TableHead>{t("shipments.acquisitionCost")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, idx) => (
            <BatchRow
              key={it.imei}
              item={it}
              modelName={modelsMap[it.modelId] || it.modelId}
              hasError={errorImei === it.imei}
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
    <div className="space-y-1 rounded-[14px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
      <span className="text-xs font-semibold">{t("shipments.landedCostResults")}</span>
      {results.map((r) => (
        <div key={r.id} className="flex justify-between text-xs">
          <span className="font-mono">{r.imei}</span>
          <span className="font-semibold">{formatMoney(r.landedCost)}</span>
        </div>
      ))}
    </div>
  )
}

export function DeviceBatchList({
  items,
  modelsMap,
  errorImei,
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
  errorImei: string | null
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
        <BatchTable items={items} modelsMap={modelsMap} errorImei={errorImei} onRemove={onRemove} />
      )}
      {canViewCost && results.length > 0 && <LandedResults results={results} />}
      <Button className="w-full" onClick={onSubmit} disabled={items.length === 0 || isSubmitting}>
        {isSubmitting ? t("common.loading") : `${t("shipments.submitBatch")} (${items.length})`}
      </Button>
    </div>
  )
}
