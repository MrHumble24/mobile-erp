import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import type { RepairView } from "../model/repair.types"

export interface RepairTicketStore {
  name: string | null
  address: string | null
  phone: string | null
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className={strong ? "font-semibold" : "text-black/70"}>{label}</span>
      <span className={strong ? "font-mono text-base font-bold" : "font-mono"}>{value}</span>
    </div>
  )
}

function Header({ repair, store }: { repair: RepairView; store: RepairTicketStore }) {
  const { t } = useI18n()
  return (
    <div className="space-y-0.5 border-b-2 border-black/30 pb-3 text-center">
      <p className="text-lg font-black uppercase tracking-wide">{store.name || t("pos.storeName")}</p>
      {store.address && <p className="text-xs text-black/70">{store.address}</p>}
      {store.phone && <p className="text-xs text-black/70">{store.phone}</p>}
      <p className="pt-1 text-sm font-semibold uppercase tracking-wider">{t("repairs.ticket")}</p>
      <p className="text-[11px] text-black/60">
        #{repair.ticketNumber} · {formatDate(repair.receivedAt)}
      </p>
    </div>
  )
}

function Device({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const code = repair.imei || repair.serialNumber
  return (
    <div className="space-y-0.5 border-b border-black/20 py-3 text-xs">
      <Row label={t("repairs.customer")} value={repair.customer.name} />
      <Row label={t("common.phone")} value={repair.customer.phone || "—"} />
      <Row label={t("repairs.device")} value={repair.deviceName} />
      {code && <Row label={repair.imei ? t("repairs.imei") : t("repairs.serial")} value={code} />}
      <div className="pt-1">
        <span className="text-black/70">{t("repairs.problem")}:</span>
        <p className="mt-0.5 whitespace-pre-wrap">{repair.problem}</p>
      </div>
    </div>
  )
}

function Money({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  return (
    <div className="space-y-0.5 border-b border-black/20 py-3 text-sm">
      <Row label={t("repairs.agreedPrice")} value={formatMoney(repair.agreedPrice)} strong />
      <Row label={t("repairs.paid")} value={formatMoney(repair.paid)} />
      <Row label={t("repairs.leftToPay")} value={formatMoney(repair.outstanding)} />
      <Row
        label={t("repairs.warrantyDays")}
        value={repair.warrantyDays > 0 ? String(repair.warrantyDays) : "—"}
      />
    </div>
  )
}

function Signatures() {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-6 pt-8">
      {[t("repairs.shopSignature"), t("repairs.customerSignature")].map((role) => (
        <div key={role} className="space-y-1 text-center">
          <div className="border-t border-black/50" />
          <p className="text-[10px] text-black/60">{role}</p>
        </div>
      ))}
    </div>
  )
}

/** The printable customer repair ticket (ADR 0040), built like the receipt. */
export function RepairTicketPaper({
  repair,
  store,
}: {
  repair: RepairView
  store: RepairTicketStore
}) {
  return (
    <div className="printable-cheque w-full max-w-[520px] rounded-[8px] border border-[#d4d4d4] bg-white p-6 font-sans text-[13px] leading-snug text-black shadow-[var(--shadow-md)] print:border-none print:p-0 print:shadow-none">
      <Header repair={repair} store={store} />
      <Device repair={repair} />
      <Money repair={repair} />
      <Signatures />
    </div>
  )
}
