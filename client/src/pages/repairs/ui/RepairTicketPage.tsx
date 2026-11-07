import { useParams, Link } from "react-router"
import { ArrowLeft, Printer, Share2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSettings } from "@/entities/settings"
import { useRepair, RepairTicketPaper, RepairLoadError, type RepairView } from "@/entities/repair"
import { Button, buttonVariants } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import { RepairsDisabled } from "./RepairsDisabled"

type TicketQuery = ReturnType<typeof useRepair>

async function shareTicket(t: (key: string) => string) {
  const url = window.location.href
  try {
    if (navigator.share) await navigator.share({ title: t("repairs.ticket"), url })
    else {
      await navigator.clipboard.writeText(url)
      toast.success(t("repairs.linkCopied"))
    }
  } catch {
    toast.error(t("repairs.shareFailed"))
  }
}

function TicketActions({ repair, backTo }: { repair: RepairView | undefined; backTo: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
      <Link to={backTo} className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-2 text-muted-foreground hover:text-foreground" })}>
        <ArrowLeft className="size-4" />
        <span>{t("common.back")}</span>
      </Link>
      {repair && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void shareTicket(t)} className="gap-1.5 rounded-full text-xs">
            <Share2 className="size-3.5" />
            <span>{t("repairs.shareTicket")}</span>
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 rounded-full text-xs shadow-xs">
            <Printer className="size-3.5" />
            <span>{t("repairs.printTicket")}</span>
          </Button>
        </div>
      )}
    </div>
  )
}

function TicketContent({ query, store }: { query: TicketQuery; store: { name: string | null; address: string | null; phone: string | null } }) {
  const { t } = useI18n()
  if (query.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
  if (query.isError) return <RepairLoadError onRetry={() => void query.refetch()} />
  if (!query.data) return <div className="py-20 text-center text-sm text-muted-foreground">{t("common.notFound")}</div>
  return <RepairTicketPaper repair={query.data} store={store} />
}

export function RepairTicketPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const settings = useSettings()
  const query = useRepair(id || null)

  if (settings.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
  if (settings.isError) return <RepairLoadError onRetry={() => void settings.refetch()} />
  if (!settings.data?.repairsEnabled) return <RepairsDisabled />

  const store = {
    name: settings.data?.storeName ?? null,
    address: settings.data?.storeAddress ?? null,
    phone: settings.data?.storePhone ?? null,
  }
  return (
    <div className="space-y-6">
      <TicketActions repair={query.data} backTo={id ? `/repairs?ticket=${encodeURIComponent(id)}` : "/repairs"} />
      <div className="flex justify-center py-4">
        <TicketContent query={query} store={store} />
      </div>
    </div>
  )
}

export default RepairTicketPage
