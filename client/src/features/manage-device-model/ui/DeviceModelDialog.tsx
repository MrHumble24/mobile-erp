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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  deviceModelFormSchema,
  defaultFormAttributes,
  toDtoAttributes,
  toFormAttributes,
  type DeviceModelFormValues,
} from "../model/device-model-form.schema"
import { AttributeEditor } from "./AttributeEditor"
import { ModelPictureField } from "./ModelPictureField"
import {
  KindField,
  CategoryField,
  BarcodeField,
  ModelCodeField,
  SalePriceField,
} from "./ModelCatalogFields"

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

function CustomsCodeField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="customsCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("inventory.customsCode")}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} />
          </FormControl>
          <FormDescription>{t("inventory.customsCodeHint")}</FormDescription>
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
        <FormItem className="flex items-center justify-between rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
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
      kindCode: model?.kindCode ?? "IMEI",
      categoryId: model?.categoryId ?? "",
      barcode: model?.barcode ?? "",
      modelCode: model?.modelCode ?? "",
      customsCode: model?.customsCode ?? "",
      salePrice: model?.salePrice ?? "",
      attributes: model ? toFormAttributes(model.attributes) : defaultFormAttributes(),
    },
  })
  const isQuantity = form.watch("kindCode") === "QUANTITY"

  const handleError = (err: { statusCode?: number; message?: string }, values: DeviceModelFormValues) => {
    if (err?.statusCode === 409) {
      // Kind change on a model with units (server message mentions "kind").
      if (/kind/i.test(err.message ?? "")) {
        form.setError("kindCode", { message: t("catalog.kindLocked") })
        return
      }
      // Barcode and name both surface a generic "already exists"; a barcode that
      // was just entered/changed is the likely culprit, else the (brand, name).
      if (values.barcode.trim() && values.barcode.trim() !== (model?.barcode ?? "")) {
        form.setError("barcode", { message: t("catalog.errorBarcodeExists") })
      } else {
        form.setError("name", { message: t("inventory.modelDuplicate") })
      }
      return
    }
    toast.error(err?.message || t("common.error"))
  }

  const onSubmit = (values: DeviceModelFormValues) => {
    const attributes = toDtoAttributes(values.attributes)
    const quantity = values.kindCode === "QUANTITY"
    const parsedPrice = values.salePrice.trim() ? Number(values.salePrice) : null
    const catalog = {
      kindCode: values.kindCode,
      categoryId: values.categoryId.trim() || null,
      barcode: values.barcode.trim() || null,
      modelCode: values.modelCode.trim() || null,
      // Customs fees apply to imported units, not accessories counted by quantity.
      customsCode: quantity ? null : values.customsCode.trim() || null,
      salePrice: quantity ? parsedPrice : null,
    }
    const opts = {
      onSuccess: () => { toast.success(t("common.success")); onDone() },
      onError: (err: { statusCode?: number; message?: string }) => handleError(err, values),
    }
    if (model) {
      updateMutation.mutate({ id: model.id, dto: { brand: values.brand, name: values.name, isActive: values.isActive, ...catalog, attributes } }, opts)
    } else {
      createMutation.mutate({ brand: values.brand, name: values.name, ...catalog, attributes }, opts)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <ModelTextField form={form} name="brand" label={t("inventory.brand")} />
        <ModelTextField form={form} name="name" label={t("inventory.model")} />
        <KindField form={form} />
        <CategoryField form={form} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BarcodeField form={form} />
          <ModelCodeField form={form} />
        </div>
        {isQuantity ? (
          <SalePriceField form={form} />
        ) : (
          <CustomsCodeField form={form} />
        )}
        <ActiveField form={form} />
        {model && <ModelPictureField model={model} />}
        {!isQuantity && <AttributeEditor form={form} savedKeys={savedKeys} />}
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
