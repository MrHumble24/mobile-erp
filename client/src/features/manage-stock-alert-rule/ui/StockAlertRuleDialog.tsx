import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateStockAlertRule,
  useUpdateStockAlertRule,
  type StockAlertRuleView,
} from "@/entities/stock-alert"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { stockAlertFormSchema, type StockAlertFormValues } from "../model/stock-alert-form.schema"
import { StockAlertRuleFields } from "./StockAlertRuleFields"

function RuleForm({ rule, onDone }: { rule: StockAlertRuleView | null; onDone: () => void }) {
  const { t } = useI18n()
  const createMutation = useCreateStockAlertRule()
  const updateMutation = useUpdateStockAlertRule()
  const isPending = createMutation.isPending || updateMutation.isPending
  const form = useForm<StockAlertFormValues>({
    resolver: zodResolver(stockAlertFormSchema),
    defaultValues: {
      modelId: rule?.modelId ?? "",
      storage: rule?.storage ?? "",
      threshold: rule?.threshold ?? 1,
    },
  })

  const onSubmit = (values: StockAlertFormValues) => {
    const opts = {
      onSuccess: () => { toast.success(t("common.success")); onDone() },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    }
    if (rule) {
      updateMutation.mutate({ id: rule.id, dto: { storage: values.storage, threshold: values.threshold } }, opts)
    } else {
      createMutation.mutate(values, opts)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <StockAlertRuleFields form={form} isEdit={Boolean(rule)} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function StockAlertRuleDialog({
  rule,
  open,
  onOpenChange,
}: {
  rule: StockAlertRuleView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? t("inventory.editRule") : t("inventory.newRule")}</DialogTitle>
        </DialogHeader>
        {open && <RuleForm key={rule?.id ?? "new"} rule={rule} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
