import { ShieldAlert, CheckCircle2, ArrowRight, Phone } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { useOverdueConsignments } from "@/entities/consignment"
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

export function DashboardOverdueConsignmentsTable() {
  const { t } = useI18n()
  const { data: overdue, isLoading } = useOverdueConsignments()

  return (
    <Card id="overdue-section" className="rounded-[20px] overflow-hidden shadow-[var(--shadow-xs)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">{t("dashboard.overdueConsignmentsTitle")}</CardTitle>
            <CardDescription className="text-xs">
              Toʻlov muddati oʻtgan hamkor nasiyalari
            </CardDescription>
          </div>
        </div>

        <Link
          to="/consignments"
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

        {overdue && overdue.length === 0 && (
          <div className="py-8 text-center px-4">
            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("dashboard.noOverdueConsignments")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Barcha hamkorlar nasiyalari oʻz vaqtida toʻlanmoqda
            </p>
          </div>
        )}

        {overdue && overdue.length > 0 && (
          <div className="overflow-x-auto border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold">{t("consignments.partner")}</TableHead>
                  <TableHead className="text-xs font-bold">{t("consignments.device")}</TableHead>
                  <TableHead className="text-xs font-bold">{t("consignments.agreedPrice")}</TableHead>
                  <TableHead className="text-xs font-bold text-right">{t("consignments.dueDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">{item.partnerShopName}</div>
                      {item.partnerPhone && (
                        <a
                          href={`tel:${item.partnerPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors font-mono mt-0.5"
                        >
                          <Phone className="size-2.5" />
                          <span>{item.partnerPhone}</span>
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{unitCode(item)}</TableCell>
                    <TableCell className="font-mono font-bold text-xs text-amber-500">
                      {formatMoney(item.agreedPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="font-mono text-[11px]">
                        {formatDate(item.dueDate)}
                      </Badge>
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
