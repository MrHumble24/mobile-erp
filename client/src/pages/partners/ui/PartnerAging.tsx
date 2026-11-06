import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { usePartnerAging, type AgingBucket } from "@/entities/partner"

function BucketCell({ bucket }: { bucket: AgingBucket }) {
  const { t } = useI18n()
  const isOverdue = bucket.bucket !== "current" && bucket.count > 0
  return (
    <div
      className={`rounded-[12px] border p-2.5 text-center min-w-[70px] ${
        isOverdue ? "border-amber-300 bg-amber-500/10" : "border-border bg-muted"
      }`}
    >
      <div className="text-[11px] text-muted-foreground truncate">{t(`partners.aging_${bucket.bucket}`)}</div>
      <div className="font-mono text-xs sm:text-sm font-bold whitespace-nowrap tabular-nums">{formatMoney(bucket.amount)}</div>
      <div className="text-[11px] text-muted-foreground">{bucket.count}</div>
    </div>
  )
}

export function PartnerAging({ partnerId }: { partnerId: string }) {
  const { t } = useI18n()
  const { data, isLoading } = usePartnerAging(partnerId)

  if (isLoading || !data) return null
  const hasAny = data.some((b) => b.count > 0)
  if (!hasAny) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight">{t("partners.agingTitle")}</h3>
      <div className="overflow-x-auto pb-1 flex gap-2 sm:grid sm:grid-cols-5">
        {data.map((b) => (
          <BucketCell key={b.bucket} bucket={b} />
        ))}
      </div>
    </div>
  )
}
