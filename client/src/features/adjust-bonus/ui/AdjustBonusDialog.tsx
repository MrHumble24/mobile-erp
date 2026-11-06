import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useAdjustCustomerBonus } from "@/entities/bonus"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  makeAdjustBonusSchema,
  toAdjustBonusDto,
  type AdjustBonusValues,
} from "../model/adjust-bonus.schema"
import { AdjustBonusFields } from "./AdjustBonusFields"

function AdjustBonusForm({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const { t } = useI18n()
  const adjust = useAdjustCustomerBonus()
  const form = useForm<AdjustBonusValues>({
    resolver: zodResolver(makeAdjustBonusSchema(t)),
    defaultValues: { amount: "", reason: "" },
  })

  const onSubmit = (values: AdjustBonusValues) => {
    adjust.mutate(
      { customerId, dto: toAdjustBonusDto(values) },
      {
        onSuccess: () => {
          toast.success(t("customers.bonusAdjusted"))
          onDone()
        },
        onError: (err: { message?: string }) =>
          toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <AdjustBonusFields form={form} />
        <Button type="submit" className="w-full" disabled={adjust.isPending}>
          {adjust.isPending ? t("common.loading") : t("customers.bonusApply")}
        </Button>
      </form>
    </Form>
  )
}

export function AdjustBonusDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("customers.bonusAdjustTitle")}</DialogTitle>
          <DialogDescription>{t("customers.bonusAdjustHint")}</DialogDescription>
        </DialogHeader>
        {open && (
          <AdjustBonusForm customerId={customerId} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
