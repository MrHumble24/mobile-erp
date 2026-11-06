import * as React from "react"
import { Printer, Copy, Check } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import { formatReceiptText } from "../../lib/format-receipt"
import type { ReceiptView } from "../../model/sale.types"

export function ChequeActions({
  receipt,
  onNewSale,
}: {
  receipt: ReceiptView
  onNewSale?: () => void
}) {
  const { t } = useI18n()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatReceiptText(receipt, t))
      setCopied(true)
      toast.success(t("pos.chequeCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("common.error"))
    }
  }

  return (
    <div className="print:hidden flex flex-wrap items-center justify-center gap-2 w-full max-w-[320px]">
      <Button onClick={() => window.print()} className="flex-1 min-w-[130px] h-9 gap-1.5 text-xs font-semibold rounded-full">
        <Printer className="size-4" />
        <span>{t("pos.printCheque")}</span>
      </Button>
      <Button variant="outline" onClick={handleCopy} className="flex-1 min-w-[130px] h-9 gap-1.5 text-xs font-semibold rounded-full">
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        <span>{copied ? t("common.yes") : t("pos.copyCheque")}</span>
      </Button>
      {onNewSale && (
        <Button
          variant="secondary"
          onClick={onNewSale}
          className="w-full h-9 text-xs font-semibold rounded-full mt-1 bg-[#f8f9fa] border border-[#e8e8e8] hover:bg-[#eeeeee]"
        >
          {t("pos.newSale")}
        </Button>
      )}
    </div>
  )
}
