import { Link } from "react-router"
import {
  Clock,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import { useCurrentShift } from "@/entities/shift"
import { useStorefrontOrderStats } from "@/entities/order"
import { useLowStock } from "@/entities/stock-alert"
import { useOverdueConsignments } from "@/entities/consignment"

export function DashboardOperationalPulse() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const canCreateSale = hasPermission("sale.create")
  const canReadOrders = hasPermission("order.read")

  const { data: currentShift } = useCurrentShift(canCreateSale)
  const { data: orderStats } = useStorefrontOrderStats()
  const { data: lowStock } = useLowStock()
  const { data: overdueConsignments } = useOverdueConsignments()

  const newOrdersCount = canReadOrders ? (orderStats?.new ?? 0) : 0
  const lowStockCount = lowStock?.length ?? 0
  const overdueCount = overdueConsignments?.length ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Smena holati */}
      {canCreateSale && (
        <Link
          to="/shifts"
          className="group flex items-center justify-between rounded-[16px] border border-border bg-card p-3.5 shadow-[var(--shadow-xs)] hover:border-primary/50 transition-all no-underline text-foreground"
        >
          <div className="flex items-center gap-3">
            <div
              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                currentShift
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              <Clock className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {currentShift ? t("dashboard.activeShift") : t("dashboard.noActiveShift")}
                </span>
                {currentShift && (
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {currentShift ? (
                  <span>
                    {t("dashboard.tillCash")}:{" "}
                    <strong className="font-mono text-foreground">
                      {formatMoney(currentShift.expectedCash)}
                    </strong>
                  </span>
                ) : (
                  <span>Kassir smenasini ochish</span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>
      )}

      {/* 2. Onlayn buyurtmalar */}
      {canReadOrders && (
        <Link
          to="/orders"
          className="group flex items-center justify-between rounded-[16px] border border-border bg-card p-3.5 shadow-[var(--shadow-xs)] hover:border-sky-500/50 transition-all no-underline text-foreground"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {t("dashboard.pendingOrders")}
                </span>
                {newOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-500 text-sky-950">
                    {newOrdersCount}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {newOrdersCount > 0
                  ? `${newOrdersCount} ta mijoz buyurtmasi kutilmoqda`
                  : "Barcha buyurtmalar ko'rib chiqilgan"}
              </div>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
      )}

      {/* 3. Zaxira ogohlantirishlari */}
      <a
        href="#low-stock-section"
        className="group flex items-center justify-between rounded-[16px] border border-border bg-card p-3.5 shadow-[var(--shadow-xs)] hover:border-amber-500/50 transition-all no-underline text-foreground"
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
              lowStockCount > 0
                ? "bg-amber-500/10 text-amber-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">
                {t("dashboard.lowStockTitle")}
              </span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-amber-950">
                  {lowStockCount}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {lowStockCount > 0
                ? `${lowStockCount} ta model qoldig'i kam`
                : t("dashboard.allGoodsInStock")}
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
      </a>

      {/* 4. Muddati o'tgan nasiyalar */}
      <a
        href="#overdue-section"
        className="group flex items-center justify-between rounded-[16px] border border-border bg-card p-3.5 shadow-[var(--shadow-xs)] hover:border-rose-500/50 transition-all no-underline text-foreground"
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
              overdueCount > 0
                ? "bg-rose-500/10 text-rose-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">
                {t("dashboard.overdueConsignmentsTitle")}
              </span>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-rose-950">
                  {overdueCount}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {overdueCount > 0
                ? `${overdueCount} ta kechiktirilgan qarz`
                : t("dashboard.noOverdueConsignments")}
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
      </a>
    </div>
  )
}
