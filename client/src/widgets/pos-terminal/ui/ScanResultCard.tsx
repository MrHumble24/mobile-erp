import { AlertTriangle, PackageSearch } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { Card, CardContent } from "@/shared/ui/card"
import { Link } from "@/shared/ui/link"
import { DeviceStatusBadge, type DeviceDetailView } from "@/entities/device"
import type { ScanResult } from "../model/use-pos-scanner"

interface StatusMessage {
  text: string
  to: string
  linkLabel: string
}

function statusMessage(
  device: DeviceDetailView,
  t: (k: string, p?: Record<string, string | number>) => string
): StatusMessage {
  switch (device.statusCode) {
    case "SOLD":
      return { text: t("pos.soldInfo", { date: formatDate(device.updatedAt) }), to: "/sales", linkLabel: t("pos.viewSale") }
    case "CONSIGNED":
      return { text: t("pos.consignedInfo"), to: "/consignments", linkLabel: t("pos.goNasiya") }
    case "DEFECTIVE":
      return { text: t("pos.defectiveInfo"), to: "/qc", linkLabel: t("pos.viewQc") }
    default:
      return { text: String(device.statusCode), to: "/inventory", linkLabel: t("common.back") }
  }
}

function StatusResult({ device }: { device: DeviceDetailView }) {
  const { t } = useI18n()
  const msg = statusMessage(device, t)
  return (
    <Card className="border-amber-300 bg-amber-500/10">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="size-4 text-amber-600" />
            {device.model?.brand} {device.model?.name}
          </div>
          <DeviceStatusBadge status={device.statusCode} />
        </div>
        <p className="text-sm text-muted-foreground">{msg.text}</p>
        <Link to={msg.to} className="text-sm">{msg.linkLabel} →</Link>
      </CardContent>
    </Card>
  )
}

function NotFoundResult({ imei }: { imei: string }) {
  const { t } = useI18n()
  return (
    <Card className="border-rose-300 bg-rose-500/10">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <PackageSearch className="size-4 text-rose-600" />
          {t("pos.notFoundInfo")}
        </div>
        <p className="text-sm text-muted-foreground font-mono">{imei}</p>
        <Link to="/shipments" className="text-sm">{t("pos.goIntake")} →</Link>
      </CardContent>
    </Card>
  )
}

export function ScanResultCard({ result }: { result: ScanResult }) {
  if (result.kind === "notFound") return <NotFoundResult imei={result.imei} />
  if (result.device) return <StatusResult device={result.device} />
  return null
}
