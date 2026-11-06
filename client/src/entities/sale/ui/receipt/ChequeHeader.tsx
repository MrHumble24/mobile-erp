import { useI18n } from "@/shared/i18n"

export function ChequeHeader({ soldAt }: { soldAt: string }) {
  const { t } = useI18n()
  return (
    <div className="text-center pb-2.5 border-b-2 border-dashed border-black/30 space-y-0.5">
      <p className="font-black text-sm uppercase tracking-wider">{t("pos.storeName")}</p>
      <p className="text-[10px] text-black/75 font-medium">{t("pos.storeLocation")}</p>
      <p className="text-[10px] text-black/60">{new Date(soldAt).toLocaleString()}</p>
    </div>
  )
}
