import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useCustomerPurchases } from "@/entities/customer-purchase"
import { BuyPhoneDialog } from "@/features/buy-phone"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { usePurchasesFilters } from "../model/use-purchases-filters"
import { PurchasesFilters } from "./PurchasesFilters"
import { PurchasesTable } from "./PurchasesTable"
import { PurchaseDetailSheet } from "./PurchaseDetailSheet"

function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  const { t } = useI18n()
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t("common.previous")}
      </Button>
      <span className="text-sm text-muted-foreground">{page} / {pages}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t("common.next")}
      </Button>
    </div>
  )
}

export function PurchasesPage() {
  const { t } = useI18n()
  const canBuy = useAuthStore((s) => s.hasPermission("purchase.create"))
  const filters = usePurchasesFilters()
  const { data, isLoading } = useCustomerPurchases(filters.queryFilters)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [buyOpen, setBuyOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.title")}
        description={t("purchases.description")}
        actions={
          canBuy && (
            <Button size="sm" className="gap-1.5" onClick={() => setBuyOpen(true)}>
              <Plus className="size-4" />
              {t("purchases.buyTitle")}
            </Button>
          )
        }
      />
      <PurchasesFilters filters={filters} />
      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <>
          <PurchasesTable purchases={data?.items ?? []} onOpen={setDetailId} />
          <Pager
            page={filters.page}
            pageSize={filters.pageSize}
            total={data?.total ?? 0}
            onPage={filters.setPage}
          />
        </>
      )}
      <PurchaseDetailSheet
        purchaseId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
      {canBuy && <BuyPhoneDialog open={buyOpen} onOpenChange={setBuyOpen} />}
    </div>
  )
}

export default PurchasesPage
