import { useParams, useNavigate, Navigate } from "react-router"
import { ArrowLeft, Printer } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSettings } from "@/entities/settings"
import { useRepair, RepairTicketPaper } from "@/entities/repair"
import { Button } from "@/shared/ui/button"

export function RepairTicketPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const { data: repair, isLoading } = useRepair(id || null)

  if (settingsLoading) return <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
  if (settings && !settings.repairsEnabled) return <Navigate to="/" replace />

  const store = {
    name: settings?.storeName ?? null,
    address: settings?.storeAddress ?? null,
    phone: settings?.storePhone ?? null,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e8e8] pb-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-[#646464] hover:text-[#202020]">
          <ArrowLeft className="size-4" />
          <span>{t("common.back")}</span>
        </Button>
        {repair && (
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 rounded-full text-xs shadow-xs">
            <Printer className="size-3.5" />
            <span>{t("repairs.printTicket")}</span>
          </Button>
        )}
      </div>

      <div className="flex justify-center py-4">
        {isLoading && <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && !repair && (
          <div className="py-20 text-center text-sm text-muted-foreground">{t("common.notFound")}</div>
        )}
        {repair && <RepairTicketPaper repair={repair} store={store} />}
      </div>
    </div>
  )
}

export default RepairTicketPage
