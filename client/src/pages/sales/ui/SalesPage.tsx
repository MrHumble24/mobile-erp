import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useSales, type SaleFilters } from "@/entities/sale"
import { WarrantyLookupPanel } from "@/features/warranty-lookup"
import { PageHeader } from "@/shared/ui/page-header"
import { SalesTable } from "./SalesTable"
import { SaleReceiptDialog } from "./SaleReceiptDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

function ChannelFilter({
  value,
  onChange,
}: {
  value?: "retail" | "b2b"
  onChange: (val?: "retail" | "b2b") => void
}) {
  const { t } = useI18n()

  return (
    <div className="w-48">
      <Select
        value={value || "all"}
        onValueChange={(val) => onChange(val === "all" ? undefined : (val as "retail" | "b2b"))}
      >
        <SelectTrigger className="h-9 rounded-[9px]">
          <SelectValue placeholder={t("sales.filterChannel")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="retail">{t("sales.channelRetail")}</SelectItem>
          <SelectItem value="b2b">{t("sales.channelB2B")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function SalesPage() {
  const { t } = useI18n()
  const [channel, setChannel] = React.useState<"retail" | "b2b" | undefined>()
  const [selectedReceiptId, setSelectedReceiptId] = React.useState<string | null>(null)

  const filters: SaleFilters = React.useMemo(() => ({ channel }), [channel])
  const { data: salePage, isLoading } = useSales(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.title")}
        description="Amalga oshirilgan savdolar ro'yxati, to'lov usullari, cheklar va kafolat muddati tekshiruvi"
        actions={<ChannelFilter value={channel} onChange={setChannel} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          {isLoading && (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
          )}
          {salePage && (
            <SalesTable
              sales={salePage.items}
              onOpenReceipt={(id) => setSelectedReceiptId(id)}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <WarrantyLookupPanel />
        </div>
      </div>

      <SaleReceiptDialog
        saleId={selectedReceiptId}
        open={Boolean(selectedReceiptId)}
        onOpenChange={(open) => !open && setSelectedReceiptId(null)}
      />
    </div>
  )
}
