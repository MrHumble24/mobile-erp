import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useSales, type SaleFilters } from "@/entities/sale"
import { WarrantyLookupPanel } from "@/features/warranty-lookup"
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
    <div className="w-56">
      <Select
        value={value || "all"}
        onValueChange={(val) => onChange(val === "all" ? undefined : (val as "retail" | "b2b"))}
      >
        <SelectTrigger className="h-10">
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
  const { data: sales, isLoading } = useSales(filters)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("sales.title")}</h1>
        </div>
        <ChannelFilter value={channel} onChange={setChannel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isLoading && (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
          )}
          {sales && (
            <SalesTable
              sales={sales}
              onOpenReceipt={(id) => setSelectedReceiptId(id)}
            />
          )}
        </div>

        <div>
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
