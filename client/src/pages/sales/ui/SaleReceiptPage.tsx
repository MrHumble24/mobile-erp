import * as React from "react"
import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Printer, Copy, Check } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSaleReceipt, ReceiptPaper, formatReceiptText, type ReceiptView } from "@/entities/sale"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"

function ReceiptActionBar({ receipt }: { receipt?: ReceiptView }) {
  const { t } = useI18n()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!receipt) return
    try {
      await navigator.clipboard.writeText(formatReceiptText(receipt, t))
      setCopied(true)
      toast.success(t("pos.chequeCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("common.error"))
    }
  }

  if (!receipt) return null

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 rounded-full text-xs">
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        <span>{copied ? t("common.yes") : t("pos.copyCheque")}</span>
      </Button>
      <Button size="sm" onClick={() => window.print()} className="gap-1.5 rounded-full text-xs shadow-xs">
        <Printer className="size-3.5" />
        <span>{t("pos.printCheque")}</span>
      </Button>
    </div>
  )
}

export function SaleReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { data: receipt, isLoading } = useSaleReceipt(id || null)

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e8e8e8]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-[#646464] hover:text-[#202020]"
        >
          <ArrowLeft className="size-4" />
          <span>{t("pos.backToSales")}</span>
        </Button>
        <ReceiptActionBar receipt={receipt} />
      </div>

      <div className="flex justify-center py-4">
        {isLoading && <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && !receipt && <div className="py-20 text-center text-sm text-muted-foreground">{t("common.notFound")}</div>}
        {receipt && <ReceiptPaper receipt={receipt} />}
      </div>
    </div>
  )
}

export default SaleReceiptPage
