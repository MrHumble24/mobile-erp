import * as React from "react"
import { Download } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useSales, type SaleView } from "@/entities/sale"
import { WarrantyLookupPanel, ReturnSaleDialog } from "@/features/warranty-lookup"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { useSalesFilters } from "../model/use-sales-filters"
import { exportSalesCsv } from "../lib/sales-csv"
import { SalesListTab } from "./SalesListTab"
import { SaleDetailSheet } from "./SaleDetailSheet"
import { SaleReceiptDialog } from "./SaleReceiptDialog"

const SALES_TABS = ["sales", "warranty"] as const
type SalesTab = (typeof SALES_TABS)[number]

interface ReturnTarget {
  id: string
  salePrice: number
}

function useSaleDialogs() {
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [receiptId, setReceiptId] = React.useState<string | null>(null)
  const [returnTarget, setReturnTarget] = React.useState<ReturnTarget | null>(null)
  return { detailId, setDetailId, receiptId, setReceiptId, returnTarget, setReturnTarget }
}

export function SalesPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<SalesTab>("sales", { validTabs: SALES_TABS })
  const hasProfitView = useAuthStore((s) => s.hasPermission("sale.profit.view"))
  const canReturn = useAuthStore((s) => s.hasPermission("sale.return"))
  const canReadUsers = useAuthStore((s) => s.hasPermission("user.read"))

  const filters = useSalesFilters()
  const { data, isLoading } = useSales(filters.queryFilters)
  const d = useSaleDialogs()

  const actions = React.useMemo(
    () => ({
      onOpenDetail: (sale: SaleView) => d.setDetailId(sale.id),
      onOpenReceipt: (id: string) => d.setReceiptId(id),
      onReturn: (sale: SaleView) =>
        d.setReturnTarget({ id: sale.id, salePrice: Number(sale.salePrice) }),
    }),
    [d]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.title")}
        description={t("sales.description")}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!data || data.items.length === 0}
            onClick={() => data && exportSalesCsv(data.items, hasProfitView)}
          >
            <Download className="size-4" />
            {t("sales.exportCsv")}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as SalesTab)}>
        <TabsList>
          <TabsTrigger value="sales">{t("sales.tabSales")}</TabsTrigger>
          <TabsTrigger value="warranty">{t("sales.tabWarranty")}</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <SalesListTab
            filters={filters}
            data={data}
            isLoading={isLoading}
            hasProfitView={hasProfitView}
            canReturn={canReturn}
            canReadUsers={canReadUsers}
            actions={actions}
          />
        </TabsContent>
        <TabsContent value="warranty">
          <div className="max-w-xl">
            <WarrantyLookupPanel onOpenSale={(id) => d.setDetailId(id)} />
          </div>
        </TabsContent>
      </Tabs>

      <SaleDetailSheet
        saleId={d.detailId}
        open={Boolean(d.detailId)}
        onClose={() => d.setDetailId(null)}
        canViewProfit={hasProfitView}
        canReturn={canReturn}
        onReceipt={(id) => d.setReceiptId(id)}
        onReturn={actions.onReturn}
      />
      <SaleReceiptDialog
        saleId={d.receiptId}
        open={Boolean(d.receiptId)}
        onOpenChange={(open) => !open && d.setReceiptId(null)}
      />
      {d.returnTarget && (
        <ReturnSaleDialog
          saleId={d.returnTarget.id}
          salePrice={d.returnTarget.salePrice}
          open={Boolean(d.returnTarget)}
          onOpenChange={(open) => !open && d.setReturnTarget(null)}
        />
      )}
    </div>
  )
}
