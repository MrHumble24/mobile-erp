import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { usePartners, type PartnerView } from "@/entities/partner"
import { RecordPaymentDialog } from "@/features/record-partner-payment"
import { ConsignDeviceDialog } from "@/features/consign-device"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { usePartnerFilters } from "../model/use-partner-filters"
import { CreatePartnerDialog } from "./CreatePartnerDialog"
import { EditPartnerDialog } from "./EditPartnerDialog"
import { PartnerLedgerDrawer } from "./PartnerLedgerDrawer"
import { PartnersFilters } from "./PartnersFilters"
import { PartnersSummary } from "./PartnersSummary"
import { PartnersTable } from "./PartnersTable"

function usePartnerDialogs() {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detail, setDetail] = React.useState<PartnerView | null>(null)
  const [payment, setPayment] = React.useState<PartnerView | null>(null)
  const [edit, setEdit] = React.useState<PartnerView | null>(null)
  const [consign, setConsign] = React.useState<PartnerView | null>(null)
  return { createOpen, setCreateOpen, detail, setDetail, payment, setPayment, edit, setEdit, consign, setConsign }
}

export function PartnersPage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("partner.manage"))
  const filters = usePartnerFilters()
  const { data: partners, isLoading } = usePartners(filters.queryFilters)
  const d = usePartnerDialogs()

  const drawerActions = React.useMemo(
    () => ({
      onRecordPayment: (p: PartnerView) => d.setPayment(p),
      onEdit: (p: PartnerView) => d.setEdit(p),
      onNewConsignment: (p: PartnerView) => d.setConsign(p),
    }),
    [d]
  )
  const rowActions = React.useMemo(
    () => ({ onOpenDetail: (p: PartnerView) => d.setDetail(p), onOpenPayment: (p: PartnerView) => d.setPayment(p) }),
    [d]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("partners.title")}
        description={t("partners.description")}
        actions={
          canManage && (
            <Button onClick={() => d.setCreateOpen(true)} className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs">
              <Plus className="size-4" />
              {t("partners.newPartner")}
            </Button>
          )
        }
      />

      <PartnersFilters filters={filters} />
      {partners && <PartnersSummary partners={partners} />}

      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <PartnersTable partners={partners ?? []} actions={rowActions} />
      )}

      <CreatePartnerDialog open={d.createOpen} onOpenChange={d.setCreateOpen} />
      <PartnerLedgerDrawer
        partner={d.detail}
        open={Boolean(d.detail)}
        onOpenChange={(open) => !open && d.setDetail(null)}
        actions={drawerActions}
      />
      <RecordPaymentDialog
        partner={d.payment}
        open={Boolean(d.payment)}
        onOpenChange={(open) => !open && d.setPayment(null)}
      />
      <EditPartnerDialog
        partner={d.edit}
        open={Boolean(d.edit)}
        onOpenChange={(open) => !open && d.setEdit(null)}
      />
      <ConsignDeviceDialog
        open={Boolean(d.consign)}
        onOpenChange={(open) => !open && d.setConsign(null)}
        initialPartnerId={d.consign?.id}
        lockPartner
      />
    </div>
  )
}
