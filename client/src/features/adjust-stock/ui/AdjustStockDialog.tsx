import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { useAdjustStock, type AdjustStockDto, type StockLevelView } from "@/entities/stock"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { adjustStockSchema, type AdjustStockFormValues } from "../model/adjust-stock.schema"

type FormApi = UseFormReturn<AdjustStockFormValues>

function ModeToggle({ form }: { form: FormApi }) {
  const { t } = useI18n()
  const mode = form.watch("mode")
  const options = [
    { value: "WRITE_OFF", label: t("catalog.writeOff") },
    { value: "COUNT_CORRECTION", label: t("catalog.countCorrection") },
  ] as const
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => form.setValue("mode", o.value)}
          className={cn(
            "h-9 flex-1 rounded-full border text-xs font-medium",
            mode === o.value
              ? "bg-[#090c1d] text-white border-[#090c1d] hover:bg-[#090c1d] hover:text-white"
              : "bg-white text-[#646464] border-[#e8e8e8] hover:bg-[#f8f9fa]"
          )}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}

function WriteOffFields({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <>
      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("catalog.writeOff")}</FormLabel>
            <FormControl>
              <Input type="number" min={1} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("catalog.adjustReason")}</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function CountFields({ form, current }: { form: FormApi; current: number }) {
  const { t } = useI18n()
  const counted = Number(form.watch("countedQuantity"))
  const diff = form.watch("countedQuantity").trim() === "" || Number.isNaN(counted)
    ? null
    : counted - current
  return (
    <>
      <FormField
        control={form.control}
        name="countedQuantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("catalog.countedQuantity")}</FormLabel>
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {diff != null && (
        <p className="text-sm text-muted-foreground">
          {t("catalog.onHand")}: {current} → {counted}{" "}
          <span className={cn("font-semibold", diff < 0 ? "text-red-600" : "text-emerald-600")}>
            ({diff >= 0 ? "+" : ""}{diff})
          </span>
        </p>
      )}
    </>
  )
}

function toDto(values: AdjustStockFormValues, modelId: string): AdjustStockDto {
  if (values.mode === "WRITE_OFF") {
    return { modelId, type: "WRITE_OFF", quantity: Number(values.quantity), note: values.note.trim() }
  }
  return {
    modelId,
    type: "COUNT_CORRECTION",
    countedQuantity: Number(values.countedQuantity),
    note: values.note.trim() || undefined,
  }
}

function AdjustForm({ product, onDone }: { product: StockLevelView; onDone: () => void }) {
  const { t } = useI18n()
  const adjust = useAdjustStock()
  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { mode: "WRITE_OFF", quantity: "", countedQuantity: "", note: "" },
  })
  const mode = form.watch("mode")

  const onSubmit = (values: AdjustStockFormValues) => {
    adjust.mutate(toDto(values, product.modelId), {
      onSuccess: () => {
        toast.success(t("catalog.stockSaved"))
        onDone()
      },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <ModeToggle form={form} />
        {mode === "WRITE_OFF" ? (
          <WriteOffFields form={form} />
        ) : (
          <CountFields form={form} current={product.quantity} />
        )}
        <Button type="submit" className="w-full" disabled={adjust.isPending}>
          {adjust.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function AdjustStockDialog({
  product,
  open,
  onOpenChange,
}: {
  product: StockLevelView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("catalog.adjustStock")}</DialogTitle>
          <DialogDescription>
            {product ? `${product.brand} ${product.name}` : ""}
          </DialogDescription>
        </DialogHeader>
        {open && product && (
          <AdjustForm key={product.modelId} product={product} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
