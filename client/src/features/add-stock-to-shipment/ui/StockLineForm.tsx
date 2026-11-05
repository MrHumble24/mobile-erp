import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import type { DeviceModelView } from "@/entities/device-model"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { stockLineSchema, type StagedLine, type StockLineFormValues } from "../model/add-stock.schema"

export function StockLineForm({
  models,
  onAdd,
}: {
  models: DeviceModelView[]
  onAdd: (line: StagedLine) => void
}) {
  const { t } = useI18n()
  const form = useForm<StockLineFormValues>({
    resolver: zodResolver(stockLineSchema),
    defaultValues: { modelId: "", quantity: "", unitCost: "" },
  })

  const onSubmit = (values: StockLineFormValues) => {
    const model = models.find((m) => m.id === values.modelId)
    onAdd({
      modelId: values.modelId,
      name: model ? `${model.brand} ${model.name}` : values.modelId,
      quantity: Number(values.quantity),
      unitCost: Number(values.unitCost),
    })
    form.reset({ modelId: "", quantity: "", unitCost: "" })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="modelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("catalog.addStock")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("inventory.model")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.brand} {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("catalog.quantity")}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("catalog.unitCost")}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" variant="outline" className="w-full gap-1.5">
          <Plus className="size-4" />
          {t("catalog.addStock")}
        </Button>
      </form>
    </Form>
  )
}
