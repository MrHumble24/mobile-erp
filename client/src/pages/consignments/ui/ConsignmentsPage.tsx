import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  useConsignments,
  useOverdueConsignments,
  type ConsignmentView,
} from "@/entities/consignment"
import { ConsignDeviceDialog } from "@/features/consign-device"
import {
  ReturnConsignmentDialog,
  SettleConsignmentDialog,
} from "@/features/settle-consignment"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { ConsignmentsTable } from "./ConsignmentsTable"

const CONSIGNMENT_TABS = ["out", "overdue", "all"] as const
type ConsignmentTab = (typeof CONSIGNMENT_TABS)[number]

interface TabContentProps {
  onSettle: (item: ConsignmentView) => void
  onReturn: (item: ConsignmentView) => void
}

function ConsignmentTabPanels({ onSettle, onReturn }: TabContentProps) {
  const { t } = useI18n()
  const { data: outPage, isLoading: outLoading } = useConsignments({ statusCode: "OUT" })
  const { data: overdueItems, isLoading: overdueLoading } = useOverdueConsignments()
  const { data: allPage, isLoading: allLoading } = useConsignments()

  return (
    <>
      <TabsContent value="out" className="mt-5">
        {outLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {outPage && <ConsignmentsTable items={outPage.items} onSettle={onSettle} onReturn={onReturn} />}
      </TabsContent>

      <TabsContent value="overdue" className="mt-5">
        {overdueLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {overdueItems && <ConsignmentsTable items={overdueItems} onSettle={onSettle} onReturn={onReturn} />}
      </TabsContent>

      <TabsContent value="all" className="mt-5">
        {allLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {allPage && <ConsignmentsTable items={allPage.items} onSettle={onSettle} onReturn={onReturn} />}
      </TabsContent>
    </>
  )
}

export function ConsignmentsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<ConsignmentTab>("out", { validTabs: CONSIGNMENT_TABS })
  const [createOpen, setCreateOpen] = React.useState(false)
  const [settleItem, setSettleItem] = React.useState<ConsignmentView | null>(null)
  const [returnItem, setReturnItem] = React.useState<ConsignmentView | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("consignments.title")}
        description="Hamkorlarga nasiyaga berilgan qurilmalar, to'lov muddatlari va hisob-kitoblar"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs">
            <Plus className="size-4" />
            {t("consignments.newConsignment")}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-auto inline-flex">
            <TabsTrigger value="out">{t("consignments.tabOut")}</TabsTrigger>
            <TabsTrigger value="overdue">{t("consignments.tabOverdue")}</TabsTrigger>
            <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
          </TabsList>
        </div>
        <ConsignmentTabPanels onSettle={setSettleItem} onReturn={setReturnItem} />
      </Tabs>

      <ConsignDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SettleConsignmentDialog
        consignment={settleItem}
        open={Boolean(settleItem)}
        onOpenChange={(open) => !open && setSettleItem(null)}
      />
      <ReturnConsignmentDialog
        consignment={returnItem}
        open={Boolean(returnItem)}
        onOpenChange={(open) => !open && setReturnItem(null)}
      />
    </div>
  )
}
