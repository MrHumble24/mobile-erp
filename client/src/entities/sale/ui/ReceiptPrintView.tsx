import { Printer } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import type { ReceiptView } from "../model/sale.types"

function ReceiptPaper({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  return (
    <div className="w-[58mm] border border-dashed border-[#d4d4d4] bg-white text-black p-3 font-mono text-[11px] leading-tight rounded shadow-sm print:border-none print:shadow-none print:m-0 print:p-0">
      <div className="text-center pb-2 border-b border-black/20 space-y-0.5">
        <p className="font-bold text-xs uppercase tracking-wider">Malika ERP / POS</p>
        <p className="text-[10px] text-black/70">Malika Bozor, Toshkent</p>
        <p className="text-[10px]">{new Date(receipt.soldAt).toLocaleString()}</p>
      </div>

      <div className="py-2 border-b border-black/20 space-y-0.5 text-[10px]">
        <div><span className="font-semibold">{t("pos.cashier")}:</span> {receipt.cashier}</div>
        <div><span className="font-semibold">ID:</span> {receipt.saleId.slice(0, 8)}</div>
        {receipt.customer && <div><span className="font-semibold">{t("pos.customer")}:</span> {receipt.customer.name}</div>}
      </div>

      <div className="py-2 border-b border-black/20 space-y-2">
        {receipt.items.map((item) => (
          <div key={item.imei} className="space-y-0.5">
            <div className="flex justify-between font-semibold">
              <span>{item.model}</span>
              <span>${item.price}</span>
            </div>
            <div className="text-[9px] text-black/70 flex justify-between">
              <span>{item.storage || ""} {item.color || ""}</span>
              <span className="font-mono">{item.imei}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="py-2 border-b border-black/20 flex justify-between text-xs font-bold">
        <span>{t("pos.totalDue")}:</span>
        <span>${receipt.total}</span>
      </div>

      {receipt.warranty && (
        <div className="py-2 text-center text-[10px] border-b border-black/20">
          <p className="font-semibold">{t("pos.warrantyUntil")}:</p>
          <p>{new Date(receipt.warranty.endsAt).toLocaleDateString()} ({receipt.warranty.days} kun)</p>
        </div>
      )}

      <div className="pt-2 text-center text-[9px] text-black/60">Xaridingiz uchun rahmat!</div>
    </div>
  )
}

export function ReceiptPrintView({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center gap-4">
      <ReceiptPaper receipt={receipt} />
      <Button onClick={() => window.print()} className="print:hidden flex items-center gap-2">
        <Printer className="w-4 h-4" />
        <span>{t("pos.printReceipt")}</span>
      </Button>
    </div>
  )
}
