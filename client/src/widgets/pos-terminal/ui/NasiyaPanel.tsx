import * as React from "react"
import { Handshake } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { Card, CardContent } from "@/shared/ui/card"
import { ConsignDeviceDialog } from "@/features/consign-device"
import type { ConsignmentView } from "@/entities/consignment"
import { focusScanner } from "../model/use-pos-scanner"

export interface NasiyaPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialImei: string
  initialAgreedPrice: string
}

function LastConsignmentSummary({ consignment }: { consignment: ConsignmentView }) {
  const { t } = useI18n()
  return (
    <Card className="border-emerald-300 bg-emerald-50/60">
      <CardContent className="p-4 space-y-1 text-sm">
        <p className="font-semibold text-emerald-700">{t("consignments.consignSuccess")}</p>
        <p className="font-mono text-xs text-muted-foreground">{unitCode(consignment)}</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("consignments.agreedPrice")}</span>
          <span className="font-semibold">{formatMoney(consignment.agreedPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("consignments.dueDate")}</span>
          <span>{formatDate(consignment.dueDate)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function NasiyaPanel({ open, onOpenChange, initialImei, initialAgreedPrice }: NasiyaPanelProps) {
  const { t } = useI18n()
  const [last, setLast] = React.useState<ConsignmentView | null>(null)

  return (
    <div className="space-y-3">
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground space-y-1">
          <Handshake className="size-6 mx-auto text-primary" />
          <p className="text-sm font-medium">{t("pos.nasiyaPrompt")}</p>
        </CardContent>
      </Card>
      {last && <LastConsignmentSummary consignment={last} />}
      <ConsignDeviceDialog
        open={open}
        onOpenChange={onOpenChange}
        initialImei={initialImei}
        initialAgreedPrice={initialAgreedPrice}
        onSuccess={(consignment) => {
          setLast(consignment)
          focusScanner()
        }}
      />
    </div>
  )
}
