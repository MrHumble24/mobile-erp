import { CheckCircle2, PhoneCall, ExternalLink } from "lucide-react"
import { Link } from "react-router"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { DialogFooter } from "@/shared/ui/dialog"

export function OrderSuccessView({
  orderId,
  shopPhone,
  onClose,
}: {
  orderId: string
  shopPhone?: string | null
  onClose: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="py-6 text-center space-y-4">
      <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-base">{t("storefront.orderSuccessTitle")}</h3>
        <p className="text-xs text-muted-foreground">{t("storefront.orderSuccessMessage")}</p>
        <span className="inline-block mt-1 font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
          #{orderId.slice(0, 8)}
        </span>
      </div>
      {shopPhone && (
        <a href={`tel:${shopPhone}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted font-mono font-semibold text-sm hover:bg-muted/80">
          <PhoneCall className="size-4 text-emerald-600" />
          <span>{shopPhone}</span>
        </a>
      )}
      <div className="pt-2 flex flex-col gap-2">
        <Button variant="outline" render={<Link to={`/shop/order/${orderId}`} onClick={onClose} />} className="w-full gap-1.5 text-xs font-semibold">
          <span>{t("storefront.viewOrderStatus")}</span>
          <ExternalLink className="size-3.5" />
        </Button>
        <DialogFooter className="pt-1">
          <Button onClick={onClose} variant="ghost" className="w-full text-xs">
            {t("storefront.close")}
          </Button>
        </DialogFooter>
      </div>
    </div>
  )
}
