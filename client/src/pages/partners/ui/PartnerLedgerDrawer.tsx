import { useI18n } from "@/shared/i18n"
import { type PartnerView, type LedgerEntry, usePartnerLedger } from "@/entities/partner"
import { Badge } from "@/shared/ui/badge"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"

function LedgerEntryRow({ entry }: { entry: LedgerEntry }) {
  const { t } = useI18n()
  const isConsignment = entry.kind === "consignment"
  const changeNum = Number(entry.change)

  return (
    <div className="p-3 border border-border rounded-lg bg-card/60 space-y-1 text-sm">
      <div className="flex justify-between items-center">
        <Badge variant={isConsignment ? "plasma" : "sulfur"}>
          {isConsignment ? t("partners.kindConsignment") : t("partners.kindPayment")}
        </Badge>
        <span
          className={`font-mono font-bold ${
            changeNum > 0 ? "text-amber-600" : "text-emerald-600"
          }`}
        >
          {changeNum > 0 ? `+$${changeNum.toLocaleString()}` : `-$${Math.abs(changeNum).toLocaleString()}`}
        </span>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground pt-1">
        <span>{new Date(entry.at).toLocaleString()}</span>
        <span>
          {t("partners.runningBalance")}: ${Number(entry.runningBalance).toLocaleString()}
        </span>
      </div>

      {entry.notes && (
        <div className="text-xs text-muted-foreground italic bg-muted/30 p-1.5 rounded">
          {entry.notes}
        </div>
      )}
    </div>
  )
}

function LedgerList({ partnerId }: { partnerId: string }) {
  const { t } = useI18n()
  const { data: entries, isLoading } = usePartnerLedger(partnerId)

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("partners.noLedgerEntries")}</p>
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {entries.map((entry, idx) => (
        <LedgerEntryRow key={`${entry.refId}-${idx}`} entry={entry} />
      ))}
    </div>
  )
}

export function PartnerLedgerDrawer({
  partner,
  open,
  onOpenChange,
}: {
  partner: PartnerView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  if (!partner) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="space-y-6">
        <SheetHeader>
          <SheetTitle>{partner.shopName}</SheetTitle>
          <SheetDescription>
            {t("partners.outstanding")}: ${Number(partner.outstanding).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">{t("partners.ledgerTitle")}</h3>
          <LedgerList partnerId={partner.id} />
        </div>
      </SheetPopup>
    </Sheet>
  )
}
