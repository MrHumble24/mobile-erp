import { Clock } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useOverdueConsignments } from "@/entities/consignment"
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

export function DashboardOverdueConsignmentsTable() {
  const { t } = useI18n()
  const { data: overdue, isLoading } = useOverdueConsignments()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Clock className="size-4 text-destructive" />
        <CardTitle className="text-base">{t("dashboard.overdueConsignmentsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {overdue && overdue.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Muddati o'tgan nasiyalar yo'q.</p>
        )}
        {overdue && overdue.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("consignments.partner")}</TableHead>
                <TableHead>{t("consignments.device")}</TableHead>
                <TableHead>{t("consignments.agreedPrice")}</TableHead>
                <TableHead>{t("consignments.dueDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold text-sm">{item.partnerShopName}</div>
                    {item.partnerPhone && (
                      <div className="text-xs text-muted-foreground">{item.partnerPhone}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.imei}</TableCell>
                  <TableCell className="font-mono font-bold text-sm text-amber-600">
                    ${Number(item.agreedPrice).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{new Date(item.dueDate).toLocaleDateString()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

