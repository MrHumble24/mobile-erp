import * as React from "react"
import { Plus, TriangleAlert, Truck } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import {
  useStockAlertRules,
  useLowStock,
  type StockAlertRuleView,
  type LowStockView,
} from "@/entities/stock-alert"
import { useDeviceModels } from "@/entities/device-model"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { StockAlertRuleDialog } from "./StockAlertRuleDialog"

type DialogState = { open: boolean; rule: StockAlertRuleView | null }
type NameOf = (modelId: string) => string

function LowStockSection({ rows, nameOf }: { rows: LowStockView[]; nameOf: NameOf }) {
  const { t } = useI18n()
  if (rows.length === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
          <TriangleAlert className="size-4" />
          {t("inventory.lowStock")}
        </h3>
        <Link to="/shipments" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <Truck className="size-3.5" />
          {t("nav.shipments")}
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => {
          const below = r.currentCount < r.threshold
          return (
            <div
              key={r.id}
              className={cn(
                "flex items-center justify-between rounded-[12px] border p-3 text-sm transition-colors",
                below ? "border-destructive/40 bg-destructive/5" : "border-border bg-card shadow-[var(--shadow-xs)]"
              )}
            >
              <span className="font-medium text-foreground">
                {nameOf(r.modelId)} · {r.storage}
              </span>
              <span className={`font-semibold flex items-center gap-1 ${below ? "text-destructive" : ""}`}>
                {below && <TriangleAlert className="size-3.5" />}
                {r.currentCount} / {r.threshold}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RulesTable({
  rules,
  nameOf,
  canManage,
  onEdit,
}: {
  rules: StockAlertRuleView[]
  nameOf: NameOf
  canManage: boolean
  onEdit: (r: StockAlertRuleView) => void
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("inventory.storage")}</TableHead>
            <TableHead>{t("inventory.threshold")}</TableHead>
            {canManage && <TableHead className="text-right">{t("common.actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted transition-colors">
              <TableCell className="font-medium text-foreground">{nameOf(r.modelId)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.storage}</TableCell>
              <TableCell className="font-mono text-xs font-semibold">{r.threshold}</TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(r)} className="h-7 text-xs">
                    {t("common.edit")}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function StockAlertPanel({ canManage }: { canManage: boolean }) {
  const { t } = useI18n()
  const { data: rules } = useStockAlertRules()
  const { data: lowStock } = useLowStock()
  const { data: models } = useDeviceModels()
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, rule: null })

  const nameOf: NameOf = (id) => {
    const m = models?.find((x) => x.id === id)
    return m ? `${m.brand} ${m.name}` : id
  }

  return (
    <div className="space-y-5">
      <LowStockSection rows={lowStock ?? []} nameOf={nameOf} />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">{t("inventory.rulesTitle")}</h3>
        {canManage && (
          <Button size="sm" onClick={() => setDialog({ open: true, rule: null })} className="gap-1.5">
            <Plus className="size-4" />
            {t("inventory.newRule")}
          </Button>
        )}
      </div>
      <RulesTable
        rules={rules ?? []}
        nameOf={nameOf}
        canManage={canManage}
        onEdit={(r) => setDialog({ open: true, rule: r })}
      />
      {canManage && (
        <StockAlertRuleDialog
          rule={dialog.rule}
          open={dialog.open}
          onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        />
      )}
    </div>
  )
}
