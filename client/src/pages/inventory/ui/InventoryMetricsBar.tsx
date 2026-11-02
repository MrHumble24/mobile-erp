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
          ? "border-[#090c1d] bg-[#f8f9fa] shadow-[var(--shadow-sm)] ring-1 ring-[#090c1d] hover:bg-[#f8f9fa]"
          : "border-[#e8e8e8] bg-white hover:bg-[#fafafa] shadow-[var(--shadow-xs)]"
      )}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-medium text-[#646464]">{label}</span>
        <div className={cn("size-7 rounded-full flex items-center justify-center shrink-0", bgClass)}>
          <Icon className={cn("size-3.5 stroke-[2.2]", colorClass)} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-bold tracking-tight font-display text-[#090c1d]">
          {count ?? "—"}
        </span>
        {alertBadge && (count ?? 0) > 0 && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e53935] bg-[#e53935]/10 px-1.5 py-0.5 rounded-full">
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
    { label: t("inventory.metricsTotal"), count: total, icon: Smartphone, colorClass: "text-[#090c1d]", bgClass: "bg-[#f0f1f5]", isActive: !selectedStatus, onClick: () => onSelectStatus(undefined) },
    { label: t("inventory.metricsInStock"), count: counts.inStock, icon: CheckCircle2, colorClass: "text-[#10b981]", bgClass: "bg-[#10b981]/10", isActive: selectedStatus === "IN_STOCK", onClick: () => toggle("IN_STOCK") },
    { label: t("inventory.metricsDefective"), count: counts.defective, icon: AlertCircle, colorClass: "text-[#e53935]", bgClass: "bg-[#e53935]/10", isActive: selectedStatus === "DEFECTIVE", onClick: () => toggle("DEFECTIVE") },
    { label: t("inventory.metricsConsigned"), count: counts.consigned, icon: ArrowUpRight, colorClass: "text-[#3b82f6]", bgClass: "bg-[#3b82f6]/10", isActive: selectedStatus === "CONSIGNED", onClick: () => toggle("CONSIGNED") },
    { label: t("inventory.metricsLowStock"), count: counts.lowStock, icon: TriangleAlert, colorClass: "text-[#f59e0b]", bgClass: "bg-[#f59e0b]/10", alertBadge: true, onClick: () => onSelectTab("alerts") },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <MetricCard key={it.label} {...it} />
      ))}
    </div>
  )
}
