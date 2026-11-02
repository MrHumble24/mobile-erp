import * as React from "react"
import { Printer, Receipt, RotateCcw, Smartphone } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSale, type SaleView } from "@/entities/sale"
import { DeviceDrawer } from "@/widgets/device-drawer"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { Skeleton } from "@/shared/ui/skeleton"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import {
  CustomerSection,
  DeviceSection,
  MoneySection,
  ReturnSection,
  SaleMetaSection,
} from "./SaleDetailSections"

function SaleActions({
  sale,
  canReturn,
  onReceipt,
  onReturn,
  onOpenDevice,
}: {
  sale: SaleView
  canReturn: boolean
  onReceipt: (id: string) => void
  onReturn: (sale: SaleView) => void
  onOpenDevice: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenDevice}>
        <Smartphone className="size-4" /> {t("sales.openDevice")}
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onReceipt(sale.id)}>
        <Receipt className="size-4" /> {t("sales.receipt")}
      </Button>
      <Link
        to={`/sales/${sale.id}/receipt`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Printer className="size-4" /> {t("sales.printReceipt")}
      </Link>
      {canReturn && !sale.return && (
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => onReturn(sale)}>
          <RotateCcw className="size-4" /> {t("sales.returnDevice")}
        </Button>
      )}
    </div>
  )
}

function SaleBody({
  sale,
  canViewProfit,
  canReturn,
  onReceipt,
  onReturn,
}: {
  sale: SaleView
  canViewProfit: boolean
  canReturn: boolean
  onReceipt: (id: string) => void
  onReturn: (sale: SaleView) => void
}) {
  const { t } = useI18n()
  const [deviceOpen, setDeviceOpen] = React.useState(false)
  return (
    <div className="my-4 space-y-5 overflow-y-auto">
      <DeviceSection sale={sale} />
      <CustomerSection sale={sale} />
      <MoneySection sale={sale} canViewProfit={canViewProfit} />
      <SaleMetaSection sale={sale} />
      {sale.notes && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold">{t("common.notes")}</h4>
          <p className="text-sm italic text-muted-foreground">"{sale.notes}"</p>
        </div>
      )}
      <ReturnSection sale={sale} />
      <SaleActions
        sale={sale}
        canReturn={canReturn}
        onReceipt={onReceipt}
        onReturn={onReturn}
        onOpenDevice={() => setDeviceOpen(true)}
      />
      <DeviceDrawer imei={sale.device.imei} open={deviceOpen} onClose={() => setDeviceOpen(false)} />
    </div>
  )
}

export function SaleDetailSheet({
  saleId,
  open,
  onClose,
  canViewProfit,
  canReturn,
  onReceipt,
  onReturn,
}: {
  saleId: string | null
  open: boolean
  onClose: () => void
  canViewProfit: boolean
  canReturn: boolean
  onReceipt: (id: string) => void
  onReturn: (sale: SaleView) => void
}) {
  const { t } = useI18n()
  const { data: sale, isLoading } = useSale(open && saleId ? saleId : "")

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("sales.detailTitle")}</SheetTitle>
          <SheetDescription>{saleId ? `#${saleId.slice(0, 8).toUpperCase()}` : ""}</SheetDescription>
        </SheetHeader>
        {isLoading && <Skeleton className="my-4 h-64 rounded-[16px]" />}
        {sale && (
          <SaleBody
            sale={sale}
            canViewProfit={canViewProfit}
            canReturn={canReturn}
            onReceipt={onReceipt}
            onReturn={onReturn}
          />
        )}
      </SheetPopup>
    </Sheet>
  )
}
