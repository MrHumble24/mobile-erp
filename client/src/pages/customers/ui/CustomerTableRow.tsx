import { Eye, Pencil, ShieldCheck, User } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import type { CustomerListItem } from "@/entities/customer"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { TableCell, TableRow } from "@/shared/ui/table"

export interface CustomerRowActions {
  onOpenDetail: (customer: CustomerListItem) => void
  onEdit: (customer: CustomerListItem) => void
}

/** Map a level code to its `pricing` i18n key (null for RETAIL / unknown). */
function levelKey(code: string): string | null {
  if (code === "WHOLESALE") return "pricing.levelWholesale"
  if (code === "PARTNER") return "pricing.levelPartner"
  return null
}

export function CustomerTableRow({
  customer,
  canManage,
  actions,
}: {
  customer: CustomerListItem
  canManage: boolean
  actions: CustomerRowActions
}) {
  const { t } = useI18n()
  const typeKey = levelKey(customer.priceLevelCode)
  const standing = Number(customer.standingDiscountPercent ?? 0)
  return (
    <TableRow className="cursor-pointer" onClick={() => actions.onOpenDetail(customer)}>
      <TableCell className="font-semibold text-sm">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span>{customer.name}</span>
          {typeKey && (
            <Badge variant="outline" className="text-[10px]">
              {t(typeKey)}
            </Badge>
          )}
          {standing > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {t("pricing.standingDiscount")}: {standing}%
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm font-mono text-muted-foreground">
        {customer.phone || "—"}
      </TableCell>
      <TableCell className="text-sm">{customer.purchaseCount}</TableCell>
      <TableCell className="text-sm font-semibold">{formatMoney(customer.totalSpent)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {customer.lastPurchaseAt ? formatDate(customer.lastPurchaseAt) : "—"}
      </TableCell>
      <TableCell>
        {customer.activeWarranties > 0 ? (
          <Badge variant="mint" className="gap-1">
            <ShieldCheck className="size-3" />
            {customer.activeWarranties}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label={t("customers.viewDetail")}
            title={t("customers.viewDetail")}
            onClick={(e) => {
              e.stopPropagation()
              actions.onOpenDetail(customer)
            }}
          >
            <Eye className="size-4" />
          </Button>
          {canManage && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label={t("customers.edit")}
              title={t("customers.edit")}
              onClick={(e) => {
                e.stopPropagation()
                actions.onEdit(customer)
              }}
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
