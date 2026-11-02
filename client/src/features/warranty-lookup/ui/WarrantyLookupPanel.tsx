import * as React from "react"
import { ShieldCheck, ShieldAlert, RotateCcw, ExternalLink } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { useWarrantyLookup, type WarrantyLookupView } from "@/entities/sale"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ReturnSaleDialog } from "./ReturnSaleDialog"

function WarrantyStatusBadge({ data }: { data: WarrantyLookupView }) {
  const { t } = useI18n()
  if (data.alreadyReturned) {
    return <Badge variant="destructive">{t("sales.alreadyReturned")}</Badge>
  }
  if (data.remainingDays <= 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        <ShieldAlert className="size-3" /> {t("sales.warrantyExpired")}
      </Badge>
    )
  }
  return (
    <Badge variant="mint" className="gap-1">
      <ShieldCheck className="size-3" />
      {data.remainingDays} {t("sales.remainingDays")}
    </Badge>
  )
}

function WarrantyInfoCard({
  data,
  onOpenReturn,
  onOpenSale,
}: {
  data: WarrantyLookupView
  onOpenReturn: () => void
  onOpenSale?: (saleId: string) => void
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-4 pt-4 border-t border-[#e8e8e8]">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-base font-semibold">{data.imei}</span>
          <p className="text-xs text-muted-foreground">
            {t("sales.soldAt")}: {formatDate(data.purchasedAt)}
          </p>
        </div>
        <WarrantyStatusBadge data={data} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f8f9fa] border border-[#e8e8e8] p-3 rounded-[12px]">
          <span className="text-xs text-muted-foreground">{t("sales.salePrice")}</span>
          <p className="font-semibold text-base">{formatMoney(data.salePrice)}</p>
        </div>
        <div className="bg-[#f8f9fa] border border-[#e8e8e8] p-3 rounded-[12px]">
          <span className="text-xs text-muted-foreground">{t("qc.grade")}</span>
          <p className="font-semibold text-base">{data.latestInspection?.grade || "—"}</p>
        </div>
      </div>

      {data.latestInspection?.notes && (
        <div className="text-xs text-muted-foreground bg-[#f8f9fa] border border-[#e8e8e8] p-2.5 rounded-[8px]">
          {data.latestInspection.notes}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {onOpenSale && (
          <Button variant="outline" className="w-full gap-2" onClick={() => onOpenSale(data.saleId)}>
            <ExternalLink className="size-4" />
            {t("sales.openSale")}
          </Button>
        )}
        {!data.alreadyReturned && (
          <Button variant="destructive" className="w-full gap-2" onClick={onOpenReturn}>
            <RotateCcw className="size-4" />
            {t("sales.returnDevice")}
          </Button>
        )}
      </div>
    </div>
  )
}

function WarrantyLookupResult({
  searchImei,
  onOpenSale,
}: {
  searchImei: string
  onOpenSale?: (saleId: string) => void
}) {
  const { t } = useI18n()
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false)
  const { data, isLoading, isError, refetch } = useWarrantyLookup(searchImei)

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
  if (isError) return <p className="text-sm text-destructive">{t("common.notFound")}</p>
  if (!data) return null

  return (
    <>
      <WarrantyInfoCard data={data} onOpenReturn={() => setReturnDialogOpen(true)} onOpenSale={onOpenSale} />
      <ReturnSaleDialog
        saleId={data.saleId}
        salePrice={Number(data.salePrice)}
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        onSuccess={() => refetch()}
      />
    </>
  )
}

export function WarrantyLookupPanel({ onOpenSale }: { onOpenSale?: (saleId: string) => void }) {
  const { t } = useI18n()
  const [imeiInput, setImeiInput] = React.useState("")
  const [searchImei, setSearchImei] = React.useState("")

  const handleScan = (code: string) => {
    const cleaned = code.trim()
    setImeiInput(cleaned)
    if (cleaned.length === 15) setSearchImei(cleaned)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("sales.warrantyLookup")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BarcodeInput
          value={imeiInput}
          onChange={(e) => setImeiInput(e.target.value)}
          onScan={handleScan}
          onClear={() => {
            setImeiInput("")
            setSearchImei("")
          }}
          placeholder={t("sales.imeiPlaceholder")}
        />
        {searchImei && searchImei.length === 15 && (
          <WarrantyLookupResult searchImei={searchImei} onOpenSale={onOpenSale} />
        )}
      </CardContent>
    </Card>
  )
}
