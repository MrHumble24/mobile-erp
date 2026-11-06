import * as React from "react"
import { Printer, Copy, Check } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { accountLabel } from "@/entities/ledger"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import type { ReceiptView, ReceiptItem } from "../model/sale.types"
import { formatReceiptText } from "../lib/format-receipt"
import { receiptBonusLines, type ReceiptBonusLine } from "../lib/receipt-bonus"

function BarcodeVisual({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 my-2 select-none" aria-hidden="true">
      <div className="h-8 flex items-center justify-center gap-[2px] overflow-hidden px-2">
        {Array.from({ length: 42 }).map((_, i) => {
          const charCode = value.charCodeAt(i % value.length) || 48
          const isThick = ((charCode + i * 7) % 3) === 0
          const isMedium = ((charCode + i * 5) % 2) === 0
          const widthClass = isThick ? "w-[3px]" : isMedium ? "w-[2px]" : "w-[1px]"
          const isHidden = (i * 13) % 9 === 0 && i > 3 && i < 38
          return (
            <div
              key={i}
              className={`h-full bg-black ${isHidden ? "opacity-0" : "opacity-100"} ${widthClass}`}
            />
          )
        })}
      </div>
      <span className="font-mono text-[9px] tracking-[0.2em] font-semibold text-black/80">{value}</span>
    </div>
  )
}

function ChequeHeader({ soldAt }: { soldAt: string }) {
  const { t } = useI18n()
  return (
    <div className="text-center pb-2.5 border-b-2 border-dashed border-black/30 space-y-0.5">
      <p className="font-black text-sm uppercase tracking-wider">{t("pos.storeName")}</p>
      <p className="text-[10px] text-black/75 font-medium">{t("pos.storeLocation")}</p>
      <p className="text-[10px] text-black/60">{new Date(soldAt).toLocaleString()}</p>
    </div>
  )
}

function ChequeMeta({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <div className="flex justify-between">
        <span className="font-semibold">{t("pos.cashier")}:</span>
        <span>{receipt.cashier}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">{t("pos.receiptNumber")}:</span>
        <span className="font-mono font-bold">#{receipt.saleId.slice(0, 8).toUpperCase()}</span>
      </div>
      {receipt.customer && (
        <div className="flex justify-between">
          <span className="font-semibold">{t("pos.customer")}:</span>
          <span>{receipt.customer.name} {receipt.customer.phone ? `(${receipt.customer.phone})` : ""}</span>
        </div>
      )}
    </div>
  )
}

function ItemIdentity({ item }: { item: ReceiptItem }) {
  const { t } = useI18n()
  if (item.quantity != null && !item.imei && !item.serialNumber) {
    return (
      <div className="text-[9px] text-black/90 tracking-wider">
        {t("catalog.pieces", { count: item.quantity })}
      </div>
    )
  }
  return (
    <>
      <div className="text-[9px] text-black/90 font-mono tracking-wider">
        {item.imei ? "IMEI" : t("catalog.serialNumber")}: {unitCode(item)}
      </div>
      {item.imei2 && (
        <div className="text-[9px] text-black/90 font-mono tracking-wider">IMEI 2: {item.imei2}</div>
      )}
    </>
  )
}

function ChequeDiscount({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  const discount = Number(receipt.discountAmount ?? 0)
  if (discount <= 0 || receipt.listPrice == null) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <div className="flex justify-between">
        <span>{t("pricing.listPrice")}</span>
        <span className="font-mono">{formatMoney(receipt.listPrice)}</span>
      </div>
      <div className="flex justify-between">
        <span>{t("pricing.discount")}</span>
        <span className="font-mono">− {formatMoney(receipt.discountAmount)}</span>
      </div>
    </div>
  )
}

function ChequeItems({ items, total }: { items: ReceiptItem[]; total: string }) {
  const { t } = useI18n()
  return (
    <>
      <div className="py-2.5 border-b-2 border-dashed border-black/30 space-y-2">
        {items.map((item, i) => (
          <div key={unitCode(item) || `${item.model}-${i}`} className="space-y-0.5">
            <div className="flex justify-between font-bold text-[11px]">
              <span className="line-clamp-1">{item.model}</span>
              <span className="shrink-0 font-mono">{formatMoney(item.price)}</span>
            </div>
            <div className="text-[9px] text-black/75 flex justify-between">
              <span>{[item.storage, item.color].filter(Boolean).join(" · ")}</span>
            </div>
            <ItemIdentity item={item} />
            {item.warranty && (
              <div className="text-[9px] text-black/75">
                {t("pos.officialWarranty")}: {item.warranty.days} {t("pos.daysShort")} ·{" "}
                {new Date(item.warranty.endsAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="py-2.5 border-b-2 border-dashed border-black/30 flex justify-between items-center text-xs font-black">
        <span className="uppercase tracking-wider">{t("pos.totalDue")}:</span>
        <span className="font-mono text-base font-bold">{formatMoney(total)}</span>
      </div>
    </>
  )
}

function ChequeTradeIns({ tradeIns }: { tradeIns: ReceiptView["tradeIns"] }) {
  const { t } = useI18n()
  if (!tradeIns || tradeIns.length === 0) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <p className="font-semibold">{t("purchases.tradeInLabel")}:</p>
      {tradeIns.map((ti) => (
        <div key={ti.deviceId} className="flex justify-between">
          <span className="truncate">
            {ti.model.brand} {ti.model.name}
            {(ti.imei || ti.serialNumber) && ` · ${ti.imei ?? ti.serialNumber}`}
          </span>
          <span className="font-mono shrink-0">− {formatMoney(ti.value)}</span>
        </div>
      ))}
    </div>
  )
}

function ChequeBonusLine({ line }: { line: ReceiptBonusLine | null }) {
  if (!line) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 text-[10px]">
      <div className="flex justify-between">
        <span>{line.label}</span>
        <span className="font-mono">{line.negative ? `− ${line.amount}` : line.amount}</span>
      </div>
    </div>
  )
}

function ChequePayments({ payments }: { payments: ReceiptView["payments"] }) {
  const { t } = useI18n()
  if (!payments || payments.length === 0) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <p className="font-semibold">{t("balance.paidWith")}:</p>
      {payments.map((p) => (
        <div key={p.accountCode} className="flex justify-between">
          <span>{accountLabel(p.accountCode, undefined, t)}</span>
          <span className="font-mono">{formatMoney(p.amount)}</span>
        </div>
      ))}
    </div>
  )
}

function ChequeWarranty({ warranty }: { warranty: ReceiptView["warranty"] }) {
  const { t } = useI18n()
  if (!warranty) return null
  return (
    <div className="my-2 p-2 border border-black/40 rounded bg-black/[0.02] text-center space-y-0.5">
      <p className="font-bold text-[10px] uppercase tracking-wider">{t("pos.officialWarranty")}</p>
      <p className="font-semibold text-[10px] text-black/90">
        {warranty.days} kun ({new Date(warranty.endsAt).toLocaleDateString()} gacha)
      </p>
      <p className="text-[8px] text-black/60 italic">{t("pos.warrantyNotice")}</p>
    </div>
  )
}

export function ReceiptPaper({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  const bonus = receiptBonusLines(receipt.bonus, t)
  const firstItem = receipt.items[0]
  const primaryImei = (firstItem && unitCode(firstItem)) || receipt.saleId.slice(0, 15)

  return (
    <div className="printable-cheque w-full max-w-[320px] sm:w-[58mm] bg-white text-black p-4 font-mono text-[11px] leading-snug rounded-[8px] border border-[#d4d4d4] shadow-[var(--shadow-md)] print:shadow-none print:border-none print:p-0">
      <ChequeHeader soldAt={receipt.soldAt} />
      <ChequeMeta receipt={receipt} />
      <ChequeDiscount receipt={receipt} />
      <ChequeItems items={receipt.items} total={receipt.total} />
      <ChequeTradeIns tradeIns={receipt.tradeIns} />
      <ChequeBonusLine line={bonus.paidWithPoints} />
      <ChequePayments payments={receipt.payments} />
      <ChequeWarranty warranty={receipt.warranty} />
      <ChequeBonusLine line={bonus.pointsEarned} />
      <BarcodeVisual value={primaryImei} />
      <div className="pt-1 text-center text-[9px] text-black/70 space-y-0.5">
        <p className="font-medium">{t("pos.thankYou")}</p>
        <p className="text-[8px] text-black/50">www.malika-erp.uz</p>
      </div>
    </div>
  )
}

function ChequeActions({
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

export function ReceiptPrintView({
  receipt,
  onNewSale,
}: {
  receipt: ReceiptView
  onNewSale?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <ReceiptPaper receipt={receipt} />
      <ChequeActions receipt={receipt} onNewSale={onNewSale} />
    </div>
  )
}
