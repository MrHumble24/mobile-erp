import { CreditCard, History } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { PartnerView } from "@/entities/partner"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

export interface PartnerRowActions {
  onOpenDetail: (p: PartnerView) => void
  onOpenPayment: (p: PartnerView) => void
}

function CreditBar({ partner }: { partner: PartnerView }) {
  const { t } = useI18n()
  const limit = Number(partner.creditLimit)
  const used = Number(partner.outstanding)
  if (limit <= 0) {
    return <span className="text-xs text-muted-foreground">{t("partners.creditUnlimited")}</span>
  }
  const pct = Math.min(100, Math.max(0, (used / limit) * 100))
  const color = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="w-32 space-y-1">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{formatMoney(used)}</span>
        <span>{formatMoney(limit)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PartnerActionButtons({ partner, actions }: { partner: PartnerView; actions: PartnerRowActions }) {
  const { t } = useI18n()
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => actions.onOpenDetail(partner)}>
        <History className="size-3.5" />
        {t("partners.ledgerTitle")}
      </Button>
      <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => actions.onOpenPayment(partner)}>
        <CreditCard className="size-3.5" />
        {t("partners.recordPayment")}
      </Button>
    </div>
  )
}

function PartnerTableRow({ partner, actions }: { partner: PartnerView; actions: PartnerRowActions }) {
  const { t } = useI18n()
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{partner.shopName}</span>
          {!partner.isActive && <Badge variant="outline">{t("partners.inactive")}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">
          {partner.contactPerson || ""} {partner.phone ? `(${partner.phone})` : ""}
        </div>
      </TableCell>
      <TableCell><CreditBar partner={partner} /></TableCell>
      <TableCell className="font-mono font-bold text-sm text-amber-600">
        {formatMoney(partner.outstanding)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-xs">
          <span>{partner.openCount} {t("partners.openCount")}</span>
          {partner.overdueCount > 0 && (
            <Badge variant="destructive">{partner.overdueCount} {t("partners.overdueCount")}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <PartnerActionButtons partner={partner} actions={actions} />
      </TableCell>
    </TableRow>
  )
}

export function PartnersTable({ partners, actions }: { partners: PartnerView[]; actions: PartnerRowActions }) {
  const { t } = useI18n()

  if (partners.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[16px] bg-card">
        {t("partners.noPartnersFound")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("partners.name")}</TableHead>
            <TableHead>{t("partners.creditUsed")}</TableHead>
            <TableHead>{t("partners.outstanding")}</TableHead>
            <TableHead>{t("partners.openCount")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((p) => (
            <PartnerTableRow key={p.id} partner={p} actions={actions} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
