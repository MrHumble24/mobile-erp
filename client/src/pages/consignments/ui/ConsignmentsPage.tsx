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
import { Button } from "@/shared/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { ConsignmentsTable } from "./ConsignmentsTable"

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
      <TabsContent value="out">
        {outLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {outPage && <ConsignmentsTable items={outPage.items} onSettle={onSettle} onReturn={onReturn} />}
      </TabsContent>

      <TabsContent value="overdue">
        {overdueLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {overdueItems && <ConsignmentsTable items={overdueItems} onSettle={onSettle} onReturn={onReturn} />}
      </TabsContent>

      <TabsContent value="all">
        {allLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {allPage && <ConsignmentsTable items={allPage.items} onSettle={onSettle} onReturn={onReturn} />}
      </TabsContent>
    </>
  )
}

export function ConsignmentsPage() {
  const { t } = useI18n()
  const [tab, setTab] = React.useState("out")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [settleItem, setSettleItem] = React.useState<ConsignmentView | null>(null)
  const [returnItem, setReturnItem] = React.useState<ConsignmentView | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("consignments.title")}</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("consignments.newConsignment")}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="out">{t("consignments.tabOut")}</TabsTrigger>
          <TabsTrigger value="overdue">{t("consignments.tabOverdue")}</TabsTrigger>
          <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
        </TabsList>
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
