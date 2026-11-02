import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useQcStats } from "@/entities/qc"
import { QcLookupsPanel } from "@/features/manage-qc-lookups"
import { GradeDeviceDialog } from "@/features/grade-device"
import { PageHeader } from "@/shared/ui/page-header"
import { Badge } from "@/shared/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { QcScanner, QC_SCANNER_ID } from "./QcScanner"
import { QueueTab } from "./QueueTab"
import { InspectionsTab } from "./InspectionsTab"
import { StatsTab } from "./StatsTab"

const QC_TABS = ["queue", "inspections", "stats", "lookups"] as const
type QcTab = (typeof QC_TABS)[number]

function QcHeader({ awaiting, onScan }: { awaiting?: number; onScan: (imei: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <PageHeader
        title={t("qc.title")}
        badge={
          awaiting != null ? (
            <Badge variant={awaiting > 0 ? "destructive" : "outline"} className="text-xs">
              {t("qc.awaitingBadge", { count: awaiting })}
            </Badge>
          ) : undefined
        }
      />
      <QcScanner onScan={onScan} />
    </div>
  )
}

function useInspectTarget() {
  const [imei, setImei] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const openFor = (next: string) => { setImei(next); setOpen(true) }
  const focusScanner = () => {
    setOpen(false)
    setTimeout(() => document.getElementById(QC_SCANNER_ID)?.focus(), 50)
  }
  return { imei, open, setOpen, openFor, focusScanner }
}

export function QcPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<QcTab>("queue", { validTabs: QC_TABS })
  const canManageLookups = useAuthStore((s) => s.hasPermission("settings.manage"))
  const { data: stats } = useQcStats()
  const inspect = useInspectTarget()

  return (
    <div className="space-y-6">
      <QcHeader awaiting={stats?.awaitingInspection} onScan={inspect.openFor} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as QcTab)}>
        <TabsList>
          <TabsTrigger value="queue">{t("qc.tabQueue")}</TabsTrigger>
          <TabsTrigger value="inspections">{t("qc.tabInspections")}</TabsTrigger>
          <TabsTrigger value="stats">{t("qc.tabStats")}</TabsTrigger>
          {canManageLookups && <TabsTrigger value="lookups">{t("qc.tabLookups")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="queue">
          <QueueTab onInspect={inspect.openFor} />
        </TabsContent>
        <TabsContent value="inspections">
          <InspectionsTab />
        </TabsContent>
        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
        {canManageLookups && (
          <TabsContent value="lookups">
            <QcLookupsPanel />
          </TabsContent>
        )}
      </Tabs>
      <GradeDeviceDialog
        imei={inspect.imei}
        open={inspect.open}
        onOpenChange={inspect.setOpen}
        onInspectNext={inspect.focusScanner}
      />
    </div>
  )
}
