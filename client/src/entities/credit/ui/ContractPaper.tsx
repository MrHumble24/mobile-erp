import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import type { CreditContract } from "../model/credit.types"

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className={strong ? "font-semibold" : "text-black/70"}>{label}</span>
      <span className={strong ? "font-mono text-base font-bold" : "font-mono"}>{value}</span>
    </div>
  )
}

function Header({ contract }: { contract: CreditContract }) {
  const { t } = useI18n()
  const { store } = contract
  return (
    <div className="space-y-0.5 border-b-2 border-black/30 pb-3 text-center">
      <p className="text-lg font-black uppercase tracking-wide">{store.name || t("pos.storeName")}</p>
      {store.address && <p className="text-xs text-black/70">{store.address}</p>}
      {store.phone && <p className="text-xs text-black/70">{store.phone}</p>}
      <p className="pt-1 text-sm font-semibold uppercase tracking-wider">{t("credit.contract")}</p>
      <p className="text-[11px] text-black/60">
        #{contract.creditId.slice(0, 8).toUpperCase()} · {formatDate(contract.createdAt)}
      </p>
    </div>
  )
}

function Parties({ contract }: { contract: CreditContract }) {
  const { t } = useI18n()
  return (
    <div className="space-y-0.5 border-b border-black/20 py-3 text-xs">
      <Row label={t("credit.buyer")} value={contract.customer.name} />
      <Row label={t("common.phone")} value={contract.customer.phone || "—"} />
    </div>
  )
}

function Goods({ contract }: { contract: CreditContract }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2 border-b border-black/20 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider">{t("credit.goods")}</p>
      {contract.goods.map((g, i) => {
        const code = g.imei || g.serialNumber
        return (
          <div key={`${code ?? g.description}-${i}`} className="text-xs">
            <div className="flex justify-between gap-3 font-semibold">
              <span className="truncate">
                {g.description}
                {g.quantity != null ? ` ×${g.quantity}` : ""}
              </span>
              <span className="shrink-0 font-mono">{formatMoney(g.price)}</span>
            </div>
            {code && <div className="font-mono text-[10px] text-black/60">{code}</div>}
          </div>
        )
      })}
    </div>
  )
}

function Totals({ contract }: { contract: CreditContract }) {
  const { t } = useI18n()
  return (
    <div className="space-y-0.5 border-b border-black/20 py-3 text-sm">
      <Row label={t("credit.agreedTotal")} value={formatMoney(contract.agreedTotal)} strong />
      <Row label={t("credit.downPayment")} value={formatMoney(contract.downPayment)} />
    </div>
  )
}

function Plan({ contract }: { contract: CreditContract }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1 border-b border-black/20 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider">{t("credit.plan")}</p>
      {contract.instalments.map((inst, i) => (
        <div key={`${inst.dueDate}-${i}`} className="flex justify-between gap-3 text-xs">
          <span>
            {t("credit.instalment", { n: i + 1 })} · {formatDate(inst.dueDate)}
          </span>
          <span className="font-mono font-semibold">{formatMoney(inst.amount)}</span>
        </div>
      ))}
    </div>
  )
}

function Signatures() {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-6 pt-8">
      {[t("credit.seller"), t("credit.buyer")].map((role) => (
        <div key={role} className="space-y-1 text-center">
          <div className="border-t border-black/50" />
          <p className="text-[10px] text-black/60">
            {role} · {t("credit.signature")}
          </p>
        </div>
      ))}
    </div>
  )
}

/** The printable no-interest credit contract (ADR 0035), built like the receipt. */
export function ContractPaper({ contract }: { contract: CreditContract }) {
  return (
    <div className="printable-cheque w-full max-w-[520px] rounded-[8px] border border-[#d4d4d4] bg-white p-6 font-sans text-[13px] leading-snug text-black shadow-[var(--shadow-md)] print:border-none print:p-0 print:shadow-none">
      <Header contract={contract} />
      <Parties contract={contract} />
      <Goods contract={contract} />
      <Totals contract={contract} />
      <Plan contract={contract} />
      <p className="py-3 text-center text-xs font-medium text-black/80">{contract.terms}</p>
      <Signatures />
    </div>
  )
}
