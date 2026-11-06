import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TriangleAlert,
} from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { useDevices } from "@/entities/device"
import { useLowStock } from "@/entities/stock-alert"

interface MetricCardProps {
  label: string
  count: number | undefined
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  bgClass: string
  isActive?: boolean
  onClick?: () => void
  alertBadge?: boolean
}

function MetricCard({
  label,
  count,
  icon: Icon,
  colorClass,
  bgClass,
  isActive,
  onClick,
  alertBadge,
}: MetricCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-full flex flex-col justify-between items-stretch p-3.5 rounded-[16px] border text-left transition-all duration-150 cursor-pointer outline-none whitespace-normal",
        isActive
          ? "border-primary bg-muted shadow-[var(--shadow-sm)] ring-1 ring-primary hover:bg-muted"
          : "border-border bg-card hover:bg-accent shadow-[var(--shadow-xs)]"
      )}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("size-7 rounded-full flex items-center justify-center shrink-0", bgClass)}>
          <Icon className={cn("size-3.5 stroke-[2.2]", colorClass)} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-bold tracking-tight font-display text-foreground">
          {count ?? "—"}
        </span>
        {alertBadge && (count ?? 0) > 0 && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
            Diqqat
          </span>
        )}
      </div>
    </Button>
  )
}

function useMetricsCounts() {
  const { data: inStock } = useDevices({ statusCode: "IN_STOCK", pageSize: 1 })
  const { data: defective } = useDevices({ statusCode: "DEFECTIVE", pageSize: 1 })
  const { data: consigned } = useDevices({ statusCode: "CONSIGNED", pageSize: 1 })
  const { data: lowStock } = useLowStock()
  return {
    inStock: inStock?.total,
    defective: defective?.total,
    consigned: consigned?.total,
    lowStock: lowStock?.length,
  }
}

interface InventoryMetricsBarProps {
  total?: number
  selectedStatus?: string
  onSelectStatus: (status: string | undefined) => void
  onSelectTab: (tab: "devices" | "models" | "alerts") => void
}

export function InventoryMetricsBar({
  total,
  selectedStatus,
  onSelectStatus,
  onSelectTab,
}: InventoryMetricsBarProps) {
  const { t } = useI18n()
  const counts = useMetricsCounts()
  const toggle = (st: string) => onSelectStatus(selectedStatus === st ? undefined : st)

  const items: MetricCardProps[] = [
    { label: t("inventory.metricsTotal"), count: total, icon: Smartphone, colorClass: "text-foreground", bgClass: "bg-muted", isActive: !selectedStatus, onClick: () => onSelectStatus(undefined) },
    { label: t("inventory.metricsInStock"), count: counts.inStock, icon: CheckCircle2, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/10", isActive: selectedStatus === "IN_STOCK", onClick: () => toggle("IN_STOCK") },
    { label: t("inventory.metricsDefective"), count: counts.defective, icon: AlertCircle, colorClass: "text-destructive", bgClass: "bg-destructive/10", isActive: selectedStatus === "DEFECTIVE", onClick: () => toggle("DEFECTIVE") },
    { label: t("inventory.metricsConsigned"), count: counts.consigned, icon: ArrowUpRight, colorClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/10", isActive: selectedStatus === "CONSIGNED", onClick: () => toggle("CONSIGNED") },
    { label: t("inventory.metricsLowStock"), count: counts.lowStock, icon: TriangleAlert, colorClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/10", alertBadge: true, onClick: () => onSelectTab("alerts") },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <MetricCard key={it.label} {...it} />
      ))}
    </div>
  )
}
