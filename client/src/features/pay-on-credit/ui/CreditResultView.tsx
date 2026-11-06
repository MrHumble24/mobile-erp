import { CheckCircle2, Printer } from "lucide-react"
import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import type { CreditView } from "@/entities/credit"

/** Success state after selling on credit: the result plus a print-contract action. */
export function CreditResultView({ credit, onDone }: { credit: CreditView; onDone: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" />
        <p className="text-base font-semibold">{t("credit.created")}</p>
      </div>
      <div className="space-y-1 rounded-[12px] border border-border bg-muted p-3 text-sm">
        <div className="flex justify-between items-center gap-2 min-w-0">
          <span className="text-muted-foreground truncate">{t("credit.agreedTotal")}</span>
          <span className="font-mono font-semibold shrink-0 whitespace-nowrap tabular-nums">{formatMoney(credit.agreedTotal)}</span>
        </div>
        <div className="flex justify-between items-center gap-2 min-w-0">
          <span className="text-muted-foreground truncate">{t("credit.paid")}</span>
          <span className="font-mono shrink-0 whitespace-nowrap tabular-nums">{formatMoney(credit.paid)}</span>
        </div>
        <div className="flex justify-between items-center gap-2 min-w-0">
          <span className="text-muted-foreground truncate">{t("credit.outstanding")}</span>
          <span className="font-mono font-semibold shrink-0 whitespace-nowrap tabular-nums">{formatMoney(credit.outstanding)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/credits/${credit.id}/contract`)}
        >
          <Printer className="size-4" />
          {t("credit.printContract")}
        </Button>
        <Button type="button" onClick={onDone}>
          {t("common.close")}
        </Button>
      </div>
    </div>
  )
}
