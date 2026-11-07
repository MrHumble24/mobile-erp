import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useLowStock } from "@/entities/stock-alert"
import { useDeviceModels } from "@/entities/device-model"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Link } from "@/shared/ui/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

export function DashboardLowStockTable() {
  const { t } = useI18n()
  const { data: lowStock, isLoading } = useLowStock()
  const { data: models } = useDeviceModels()

  const modelMap = new Map(models?.map((m) => [m.id, `${m.brand} ${m.name}`]))

  return (
    <Card id="low-stock-section" className="rounded-[20px] overflow-hidden shadow-[var(--shadow-xs)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">{t("dashboard.lowStockTitle")}</CardTitle>
            <CardDescription className="text-xs">
              Belgilangan chegaradan kam qolgan modellar
            </CardDescription>
          </div>
        </div>

        <Link
          to="/stock"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 no-underline"
        >
          <span>{t("dashboard.viewAll")}</span>
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {t("common.loading")}
          </div>
        )}

        {lowStock && lowStock.length === 0 && (
          <div className="py-8 text-center px-4">
            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("dashboard.allGoodsInStock")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hozircha zaxira kamaygan tovarlar yoʻq
            </p>
          </div>
        )}

        {lowStock && lowStock.length > 0 && (
          <div className="overflow-x-auto border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold">{t("inventory.model")}</TableHead>
                  <TableHead className="text-xs font-bold">{t("inventory.storage")}</TableHead>
                  <TableHead className="text-xs font-bold">{t("dashboard.currentCount")}</TableHead>
                  <TableHead className="text-xs font-bold text-right">{t("dashboard.threshold")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-xs">
                      {modelMap.get(item.modelId) || item.modelId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.storage || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-xs font-bold">
                        {item.currentCount} dona
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">
                      {item.threshold} dona
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
