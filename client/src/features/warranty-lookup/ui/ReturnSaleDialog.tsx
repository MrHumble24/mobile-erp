import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useReturnSale } from "@/entities/sale"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

interface ReturnFieldsProps {
  refundAmount: number
  setRefundAmount: (v: number) => void
  deviceToStatusCode: "IN_STOCK" | "DEFECTIVE"
  setDeviceToStatusCode: (v: "IN_STOCK" | "DEFECTIVE") => void
  reason: string
  setReason: (v: string) => void
}

function ReturnFields({
  refundAmount,
  setRefundAmount,
  deviceToStatusCode,
  setDeviceToStatusCode,
  reason,
  setReason,
}: ReturnFieldsProps) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("sales.refundAmount")}</Label>
        <Input
          type="number"
          min={0}
          value={refundAmount}
          onChange={(e) => setRefundAmount(Number(e.target.value))}
          className="h-10 text-base font-bold"
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{t("sales.returnCondition")}</Label>
        <Select
          value={deviceToStatusCode}
          onValueChange={(val) => setDeviceToStatusCode(val as "IN_STOCK" | "DEFECTIVE")}
        >
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_STOCK">{t("sales.returnToStock")}</SelectItem>
            <SelectItem value="DEFECTIVE">{t("sales.returnToDefective")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>{t("sales.returnReason")}</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Qaytarish sababi..."
          className="h-10"
        />
      </div>
    </>
  )
}

function ReturnSaleForm({
  saleId,
  salePrice,
  onCancel,
  onSuccess,
}: {
  saleId: string
  salePrice: number
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const returnMutation = useReturnSale()
  const [refundAmount, setRefundAmount] = React.useState(salePrice)
  const [reason, setReason] = React.useState("")
  const [deviceToStatusCode, setDeviceToStatusCode] = React.useState<"IN_STOCK" | "DEFECTIVE">("IN_STOCK")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dto = { refundAmount: Number(refundAmount), reason: reason || undefined, deviceToStatusCode }
    returnMutation.mutate(
      { id: saleId, dto },
      {
        onSuccess: () => {
          toast.success(t("sales.returnSuccess"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => {
          toast.error(err?.statusCode === 409 ? t("common.retry") : (err?.message || t("common.error")))
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <ReturnFields
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        deviceToStatusCode={deviceToStatusCode}
        setDeviceToStatusCode={setDeviceToStatusCode}
        reason={reason}
        setReason={setReason}
      />
      <Button type="submit" variant="destructive" className="w-full" disabled={returnMutation.isPending}>
        {returnMutation.isPending ? t("common.loading") : t("sales.returnDevice")}
      </Button>
    </form>
  )
}

export function ReturnSaleDialog({
  saleId,
  salePrice,
  open,
  onOpenChange,
  onSuccess,
}: {
  saleId: string
  salePrice: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("sales.returnDevice")}</DialogTitle>
          <DialogDescription>ID: {saleId.slice(0, 8)}</DialogDescription>
        </DialogHeader>

        {open && (
          <ReturnSaleForm
            saleId={saleId}
            salePrice={salePrice}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
