import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { usePartners, type PartnerView } from "@/entities/partner"
import { RecordPaymentDialog } from "@/features/record-partner-payment"
import { Button } from "@/shared/ui/button"
import { CreatePartnerDialog } from "./CreatePartnerDialog"
import { PartnerLedgerDrawer } from "./PartnerLedgerDrawer"
import { PartnersTable } from "./PartnersTable"

export function PartnersPage() {
  const { t } = useI18n()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [ledgerPartner, setLedgerPartner] = React.useState<PartnerView | null>(null)
  const [paymentPartner, setPaymentPartner] = React.useState<PartnerView | null>(null)

  const { data: partners, isLoading } = usePartners()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("partners.title")}</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("partners.newPartner")}
        </Button>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      )}

      {partners && (
        <PartnersTable
          partners={partners}
          onOpenLedger={setLedgerPartner}
          onOpenPayment={setPaymentPartner}
        />
      )}

      <CreatePartnerDialog open={createOpen} onOpenChange={setCreateOpen} />

      <PartnerLedgerDrawer
        partner={ledgerPartner}
        open={Boolean(ledgerPartner)}
        onOpenChange={(open) => !open && setLedgerPartner(null)}
      />

      <RecordPaymentDialog
        partner={paymentPartner}
        open={Boolean(paymentPartner)}
        onOpenChange={(open) => !open && setPaymentPartner(null)}
      />
    </div>
  )
}
