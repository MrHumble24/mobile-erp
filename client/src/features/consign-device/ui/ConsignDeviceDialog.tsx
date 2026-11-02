import { useI18n } from "@/shared/i18n"
import type { ConsignmentView } from "@/entities/consignment"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { ConsignDeviceForm } from "./ConsignDeviceForm"

export function ConsignDeviceDialog({
  open,
  onOpenChange,
  onSuccess,
  initialImei,
  initialAgreedPrice,
  initialPartnerId,
  lockPartner,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (consignment: ConsignmentView) => void
  initialImei?: string
  initialAgreedPrice?: string
  initialPartnerId?: string
  lockPartner?: boolean
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("consignments.newConsignment")}</DialogTitle>
        </DialogHeader>
        {open && (
          <ConsignDeviceForm
            key={initialPartnerId ?? initialImei ?? "new"}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
            initialImei={initialImei}
            initialAgreedPrice={initialAgreedPrice}
            initialPartnerId={initialPartnerId}
            lockPartner={lockPartner}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
