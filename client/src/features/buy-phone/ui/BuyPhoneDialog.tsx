import * as React from "react"
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
import { CustomerPicker, type CustomerSelection } from "@/entities/customer"
import { useCreatePurchase, type CreateCustomerPurchaseDto } from "@/entities/customer-purchase"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"
import { buyErrorMessage } from "../lib/buy-error"

interface BuyPhoneValues extends UsedUnitValues {
  pricePaid: number
  accountCode: "CASH" | "CARD"
}

function sellerPart(seller: CustomerSelection): Pick<CreateCustomerPurchaseDto, "customerId" | "customer"> {
  if ("customerId" in seller) return { customerId: seller.customerId }
  return { customer: { name: seller.name, phone: seller.phone } }
}

function PriceFields({ form }: { form: UseFormReturn<BuyPhoneValues> }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <Controller
        control={form.control}
        name="pricePaid"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("purchases.pricePaid")}</Label>
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
      <Controller
        control={form.control}
        name="accountCode"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("purchases.account")}</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">{t("balance.accountCash")}</SelectItem>
                <SelectItem value="CARD">{t("balance.accountCard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      />
    </div>
  )
}

function BuyPhoneForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const { data: models } = useDeviceModels()
  const create = useCreatePurchase()
  const [seller, setSeller] = React.useState<CustomerSelection | null>(null)
  const form = useForm<BuyPhoneValues>({
    defaultValues: { ...emptyUsedUnit(), pricePaid: 0, accountCode: "CASH" },
  })
  const values = useWatch({ control: form.control }) as BuyPhoneValues
  const ready = Boolean(seller) && usedUnitReady(values) && Number(values.pricePaid) > 0

  const onSubmit = (v: BuyPhoneValues) => {
    if (!seller) return
    const dto: CreateCustomerPurchaseDto = {
      ...sellerPart(seller),
      ...usedUnitToPayload(v),
      pricePaid: Number(v.pricePaid),
      accountCode: v.accountCode,
    }
    create.mutate(dto, {
      onSuccess: () => {
        toast.success(t("purchases.buySuccess"))
        onDone()
      },
      onError: (err) => toast.error(buyErrorMessage(err, t)),
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
      <div className="space-y-1">
        <Label>{t("purchases.seller")}</Label>
        <CustomerPicker value={seller} onChange={setSeller} />
      </div>
      <UsedUnitFields form={form} models={models ?? []} />
      <PriceFields form={form} />
      <Button type="submit" className="w-full" disabled={!ready || create.isPending}>
        {create.isPending ? t("common.loading") : t("purchases.buyTitle")}
      </Button>
    </form>
  )
}

export interface BuyPhoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Buy a used phone from a seller: it lands in stock and the money posts out (ADR 0039). */
export function BuyPhoneDialog({ open, onOpenChange }: BuyPhoneDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("purchases.buyTitle")}</DialogTitle>
          <DialogDescription>{t("purchases.buyHint")}</DialogDescription>
        </DialogHeader>
        {open && <BuyPhoneForm onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
