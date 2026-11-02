import { useI18n } from "@/shared/i18n"
import { useOutboxStore, selectPending, useDrainNow } from "@/entities/sync"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { QueueTab } from "./QueueTab"
import { ConflictsTab } from "./ConflictsTab"

const SYNC_TABS = ["queue", "conflicts"] as const
type SyncTab = (typeof SYNC_TABS)[number]

export function SyncPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<SyncTab>("queue", { validTabs: SYNC_TABS })
  const pendingCount = useOutboxStore(selectPending).length
  const drain = useDrainNow()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sync.title")}
        description={t("sync.subtitle")}
        actions={
          <Button size="sm" variant="outline" disabled={pendingCount === 0} onClick={drain}>
            {t("sync.retry")}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as SyncTab)}>
        <TabsList>
          <TabsTrigger value="queue">{t("sync.tabQueue")}</TabsTrigger>
          <TabsTrigger value="conflicts">{t("sync.tabConflicts")}</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>
        <TabsContent value="conflicts">
          <ConflictsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
