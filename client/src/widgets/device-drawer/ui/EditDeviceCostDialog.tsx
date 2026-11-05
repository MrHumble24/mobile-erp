import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useEditDeviceExpense,
  useEditDeviceCustomsFee,
  type DeviceDetailView,
} from "@/entities/device"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { editCostSchema, type EditCostValues } from "../model/edit-cost.schema"

export type CostField = "expense" | "customs"

function useSubmitCost(device: DeviceDetailView, field: CostField, onDone: () => void) {
  const { t } = useI18n()
  const expenseMutation = useEditDeviceExpense()
  const customsMutation = useEditDeviceCustomsFee()
  const mutation = field === "expense" ? expenseMutation : customsMutation

  const submit = (values: EditCostValues) => {
    const amount = Number(values.amount)
    const handlers = {
      onSuccess: () => {
        toast.success(
          field === "expense"
            ? t("inventory.unitExpenseSaved")
            : t("inventory.customsFeeSaved")
        )
        onDone()
      },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    }
    if (field === "expense") {
      expenseMutation.mutate(
        { id: device.id, dto: { unitExpense: amount, unitExpenseNote: values.note?.trim() || null } },
        handlers
      )
    } else {
      customsMutation.mutate({ id: device.id, dto: { customsFee: amount } }, handlers)
    }
  }

  return { submit, isPending: mutation.isPending }
}

function CostForm({
  device,
  field,
  onDone,
}: {
  device: DeviceDetailView
  field: CostField
  onDone: () => void
}) {
  const { t } = useI18n()
  const form = useForm<EditCostValues>({
    resolver: zodResolver(editCostSchema),
    defaultValues: {
      amount: field === "expense" ? (device.unitExpense ?? "0") : (device.customsFee ?? "0"),
      note: device.unitExpenseNote ?? "",
    },
  })
  const { submit, isPending } = useSubmitCost(device, field, onDone)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4 my-2">
        <FormField
          control={form.control}
          name="amount"
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>
                {field === "expense" ? t("inventory.unitExpense") : t("inventory.customsFee")}
              </FormLabel>
              <FormControl>
                <Input type="number" min={0} {...f} />
              </FormControl>
              {field === "expense" && <FormDescription>{t("inventory.unitExpenseHint")}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        {field === "expense" && (
          <FormField
            control={form.control}
            name="note"
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>{t("inventory.unitExpenseNote")}</FormLabel>
                <FormControl>
                  <Input {...f} value={f.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function EditDeviceCostDialog({
  device,
  field,
  open,
  onOpenChange,
}: {
  device: DeviceDetailView | null
  field: CostField
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {field === "expense" ? t("inventory.editUnitExpense") : t("inventory.editCustomsFee")}
          </DialogTitle>
        </DialogHeader>
        {open && device && (
          <CostForm key={`${device.id}-${field}`} device={device} field={field} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
