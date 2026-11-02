import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateDeviceModel,
  useUpdateDeviceModel,
  type DeviceModelView,
} from "@/entities/device-model"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  deviceModelFormSchema,
  defaultFormAttributes,
  toDtoAttributes,
  toFormAttributes,
  type DeviceModelFormValues,
} from "../model/device-model-form.schema"
import { AttributeEditor } from "./AttributeEditor"

type FormApi = UseFormReturn<DeviceModelFormValues>

function ModelTextField({ form, name, label }: { form: FormApi; name: "brand" | "name"; label: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ActiveField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="isActive"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <FormLabel className="mb-0">{t("inventory.modelActive")}</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function ModelForm({ model, onDone }: { model: DeviceModelView | null; onDone: () => void }) {
  const { t } = useI18n()
  const createMutation = useCreateDeviceModel()
  const updateMutation = useUpdateDeviceModel()
  const isPending = createMutation.isPending || updateMutation.isPending
  const savedKeys = new Set((model?.attributes ?? []).map((a) => a.key))
  const form = useForm<DeviceModelFormValues>({
    resolver: zodResolver(deviceModelFormSchema),
    defaultValues: {
      brand: model?.brand ?? "",
      name: model?.name ?? "",
      isActive: model?.isActive ?? true,
      attributes: model ? toFormAttributes(model.attributes) : defaultFormAttributes(),
    },
  })

  const handleError = (err: { statusCode?: number; message?: string }) => {
    if (err?.statusCode === 409) {
      form.setError("name", { message: t("inventory.modelDuplicate") })
      return
    }
    toast.error(err?.message || t("common.error"))
  }

  const onSubmit = (values: DeviceModelFormValues) => {
    const attributes = toDtoAttributes(values.attributes)
    const opts = { onSuccess: () => { toast.success(t("common.success")); onDone() }, onError: handleError }
    if (model) updateMutation.mutate({ id: model.id, dto: { ...values, attributes } }, opts)
    else createMutation.mutate({ brand: values.brand, name: values.name, attributes }, opts)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <ModelTextField form={form} name="brand" label={t("inventory.brand")} />
        <ModelTextField form={form} name="name" label={t("inventory.model")} />
        <ActiveField form={form} />
        <AttributeEditor form={form} savedKeys={savedKeys} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function DeviceModelDialog({
  model,
  open,
  onOpenChange,
}: {
  model: DeviceModelView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? t("inventory.editModel") : t("inventory.newModel")}</DialogTitle>
        </DialogHeader>
        {open && <ModelForm key={model?.id ?? "new"} model={model} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
