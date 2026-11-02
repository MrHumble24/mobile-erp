import { CreditCard, History } from "lucide-react"
import { useI18n } from "@/shared/i18n"
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

function PartnerActionButtons({
  partner,
  onOpenLedger,
  onOpenPayment,
}: {
  partner: PartnerView
  onOpenLedger: (p: PartnerView) => void
  onOpenPayment: (p: PartnerView) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-8 text-xs"
        onClick={() => onOpenLedger(partner)}
      >
        <History className="size-3.5" />
        {t("partners.ledgerTitle")}
      </Button>
      <Button
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => onOpenPayment(partner)}
      >
        <CreditCard className="size-3.5" />
        {t("partners.recordPayment")}
      </Button>
    </div>
  )
}

function PartnerTableRow({
  partner,
  onOpenLedger,
  onOpenPayment,
}: {
  partner: PartnerView
  onOpenLedger: (p: PartnerView) => void
  onOpenPayment: (p: PartnerView) => void
}) {
  const { t } = useI18n()
  const limit = Number(partner.creditLimit)

  return (
    <TableRow>
      <TableCell>
        <div className="font-semibold text-sm">{partner.shopName}</div>
        <div className="text-xs text-muted-foreground">
          {partner.contactPerson || ""} {partner.phone ? `(${partner.phone})` : ""}
        </div>
      </TableCell>
      <TableCell className="text-sm font-mono">
        {limit === 0 ? "∞" : `$${limit.toLocaleString()}`}
      </TableCell>
      <TableCell className="font-mono font-bold text-sm text-amber-600">
        ${Number(partner.outstanding).toLocaleString()}
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
        <PartnerActionButtons
          partner={partner}
          onOpenLedger={onOpenLedger}
          onOpenPayment={onOpenPayment}
        />
      </TableCell>
    </TableRow>
  )
}

export function PartnersTable({
  partners,
  onOpenLedger,
  onOpenPayment,
}: {
  partners: PartnerView[]
  onOpenLedger: (p: PartnerView) => void
  onOpenPayment: (p: PartnerView) => void
}) {
  const { t } = useI18n()

  if (partners.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
        {t("partners.noPartnersFound")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("partners.name")}</TableHead>
          <TableHead>{t("partners.creditLimit")}</TableHead>
          <TableHead>{t("partners.outstanding")}</TableHead>
          <TableHead>{t("partners.openCount")}</TableHead>
          <TableHead className="text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {partners.map((p) => (
          <PartnerTableRow
            key={p.id}
            partner={p}
            onOpenLedger={onOpenLedger}
            onOpenPayment={onOpenPayment}
          />
        ))}
      </TableBody>
    </Table>
  )
}
