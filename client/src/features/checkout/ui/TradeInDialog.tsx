import { useForm, useWatch, Controller, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  UsedUnitFields,
  useDeviceModels,
  emptyUsedUnit,
  usedUnitReady,
  usedUnitToPayload,
  type UsedUnitValues,
} from "@/entities/device-model"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useTradeInStore } from "../model/trade-in.store"

interface TradeInValues extends UsedUnitValues {
  value: number
}

export interface TradeInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ValueField({ form }: { form: UseFormReturn<TradeInValues> }) {
  const { t } = useI18n()
  return (
    <Controller
      control={form.control}
      name="value"
      render={({ field }) => (
        <div className="space-y-1">
          <Label>{t("purchases.tradeInValue")}</Label>
          <Input
            type="number"
            min={0}
            value={field.value}
            onChange={(e) => field.onChange(Number(e.target.value))}
            className="h-10 text-base font-bold"
          />
        </div>
      )}
    />
  )
}

/** Adds one traded-in phone (same unit fields as a purchase + its agreed value). */
export function TradeInDialog({ open, onOpenChange }: TradeInDialogProps) {
  const { t } = useI18n()
  const { data: models } = useDeviceModels()
  const addTradeIn = useTradeInStore((s) => s.addTradeIn)
  const form = useForm<TradeInValues>({ defaultValues: { ...emptyUsedUnit(), value: 0 } })
  const values = useWatch({ control: form.control }) as TradeInValues
  const ready = usedUnitReady(values) && Number(values.value) > 0

  const onSubmit = (v: TradeInValues) => {
    const unit = usedUnitToPayload(v)
    const model = models?.find((m) => m.id === v.modelId)
    addTradeIn({
      modelId: v.modelId,
      modelLabel: model ? `${model.brand} ${model.name}` : v.modelId,
      imei: unit.imei,
      imei2: unit.imei2,
      serialNumber: unit.serialNumber,
      specs: unit.specs,
      value: Number(v.value),
    })
    form.reset({ ...emptyUsedUnit(), value: 0 })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("purchases.tradeInAdd")}</DialogTitle>
          <DialogDescription>{t("purchases.tradeInHint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
          <UsedUnitFields form={form} models={models ?? []} />
          <ValueField form={form} />
          <Button type="submit" className="w-full" disabled={!ready}>
            {t("purchases.tradeInAdd")}
          </Button>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
