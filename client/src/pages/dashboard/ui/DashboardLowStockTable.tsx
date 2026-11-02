import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useLowStock } from "@/entities/stock-alert"
import { useDeviceModels } from "@/entities/device-model"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
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
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <AlertTriangle className="size-4 text-amber-500" />
        <CardTitle className="text-base">{t("dashboard.lowStockTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {lowStock && lowStock.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Barcha tovarlar yetarli miqdorda.</p>
        )}
        {lowStock && lowStock.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inventory.model")}</TableHead>
                <TableHead>{t("inventory.storage")}</TableHead>
                <TableHead>{t("dashboard.currentCount")}</TableHead>
                <TableHead>{t("dashboard.threshold")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-sm">
                    {modelMap.get(item.modelId) || item.modelId}
                  </TableCell>
                  <TableCell className="text-sm">{item.storage}</TableCell>
                  <TableCell>
                    <Badge variant="ember">{item.currentCount} dona</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{item.threshold} dona</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
