import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { useCredits } from "@/entities/credit"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"

/** The customer's credits, shown on their detail; a row jumps to the credits page. */
export function CustomerCreditsList({ customerId }: { customerId: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data, isLoading } = useCredits({ customerId })

  if (isLoading) return <Skeleton className="h-20 rounded-[12px]" />
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("credit.noCredits")}</p>
  }

  return (
    <div className="space-y-2">
      {data.map((credit) => (
        <Button
          key={credit.id}
          type="button"
          variant="outline"
          onClick={() => navigate("/credits")}
          className="flex h-auto w-full items-center justify-between gap-3 rounded-[10px] border-[#e8e8e8] bg-white p-2.5 text-left text-sm font-normal"
        >
          <span>
            <span className="block font-mono font-semibold">{formatMoney(credit.outstanding)}</span>
            <span className="block text-xs text-muted-foreground">
              {t("credit.agreedTotal")}: {formatMoney(credit.agreedTotal)} · {formatDate(credit.createdAt)}
            </span>
          </span>
          {credit.settled ? (
            <Badge variant="outline">{t("credit.settled")}</Badge>
          ) : Number(credit.overdueAmount) > 0 ? (
            <Badge variant="destructive">{t("credit.overdue")}</Badge>
          ) : (
            <Badge variant="violet">{t("credit.open")}</Badge>
          )}
        </Button>
      ))}
    </div>
  )
}
