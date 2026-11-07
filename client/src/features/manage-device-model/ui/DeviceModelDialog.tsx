import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateDeviceModel,
  useUpdateDeviceModel,
  type DeviceModelView,
} from "@/entities/device-model"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  deviceModelFormSchema,
  defaultFormAttributes,
  slugKey,
  toDtoAttributes,
  toFormAttributes,
  type DeviceModelFormValues,
} from "../model/device-model-form.schema"
import { uploadStagedModelPictures } from "../lib/upload-model-pictures"
import { useModelCodeLookup } from "../model/use-model-code-lookup"
import { AttributeEditor } from "./AttributeEditor"
import { ModelPictureField } from "./ModelPictureField"
import { ColorPicturesField } from "./ColorPicturesField"
import { ModelCodeLookupPanel } from "./ModelCodeLookupPanel"
import { SimpleSpecFields } from "./SimpleSpecFields"
import { ProductPriceGrid } from "./ProductPriceGrid"
import {
  KindField,
  CategoryField,
  BarcodeField,
  ModelCodeField,
  SalePriceField,
} from "./ModelCatalogFields"
import {
  ModelTextField,
  CustomsCodeField,
  ActiveField,
  ExpandableSection,
  OptionalSection,
} from "./ModelDialogSections"

function extractColorOptions(attributes: DeviceModelFormValues["attributes"]): string[] {
  const colorAttr = attributes.find(
    (a) => a.key === "color" || slugKey(a.label) === "color"
  )
  return colorAttr?.options ?? []
}

function ModelForm({
  model,
  canManagePrices,
  onDone,
}: {
  model: DeviceModelView | null
  canManagePrices: boolean
  onDone: () => void
}) {
  const { t } = useI18n()
  const createMutation = useCreateDeviceModel()
  const updateMutation = useUpdateDeviceModel()
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [stagedMainImage, setStagedMainImage] = useState<File | null>(null)
  const [stagedColorImages, setStagedColorImages] = useState<Record<string, File>>({})

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
  const attributes = useWatch({ control: form.control, name: "attributes" }) ?? []
  const colorOptions = extractColorOptions(attributes)
  const lookup = useModelCodeLookup(form)

  const isPending = createMutation.isPending || updateMutation.isPending || isUploadingFiles

  const handleError = (err: { statusCode?: number; message?: string }, values: DeviceModelFormValues) => {
    if (err?.statusCode === 409) {
      if (/kind/i.test(err.message ?? "")) {
        form.setError("kindCode", { message: t("catalog.kindLocked") })
        return
      }
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
    const dtoAttributes = toDtoAttributes(values.attributes)
    const quantity = values.kindCode === "QUANTITY"
    const parsedPrice = values.salePrice.trim() ? Number(values.salePrice) : null
    const catalog = {
      kindCode: values.kindCode,
      categoryId: values.categoryId.trim() || null,
      barcode: values.barcode.trim() || null,
      modelCode: values.modelCode.trim() || null,
      customsCode: quantity ? null : values.customsCode.trim() || null,
      salePrice: quantity ? parsedPrice : null,
    }

    if (model) {
      updateMutation.mutate(
        { id: model.id, dto: { brand: values.brand, name: values.name, isActive: values.isActive, ...catalog, attributes: dtoAttributes } },
        {
          onSuccess: () => {
            toast.success(t("common.success"))
            onDone()
          },
          onError: (err: { statusCode?: number; message?: string }) => handleError(err, values),
        }
      )
    } else {
      createMutation.mutate(
        { brand: values.brand, name: values.name, ...catalog, attributes: dtoAttributes },
        {
          onSuccess: async (created: DeviceModelView) => {
            lookup.rememberLink(created.id)
            setIsUploadingFiles(true)
            try {
              await uploadStagedModelPictures(created.id, stagedMainImage, stagedColorImages)
            } catch (err: unknown) {
              toast.error((err as { message?: string })?.message || t("common.error"))
            } finally {
              setIsUploadingFiles(false)
            }
            toast.success(t("common.success"))
            onDone()
          },
          onError: (err: { statusCode?: number; message?: string }) => handleError(err, values),
        }
      )
    }
  }

  return (
    <Form {...form}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
        <form
          id="device-model-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {!model && <ModelCodeLookupPanel lookup={lookup} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModelTextField form={form} name="brand" label={t("inventory.brand")} />
            <ModelTextField form={form} name="name" label={t("inventory.model")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KindField form={form} />
            <ModelCodeField form={form} />
          </div>
          {isQuantity ? (
            <SalePriceField form={form} />
          ) : (
            <SimpleSpecFields form={form} />
          )}
          <OptionalSection>
            <CategoryField form={form} />
            <BarcodeField form={form} />
            {!isQuantity && <CustomsCodeField form={form} />}
            <ActiveField form={form} />
          </OptionalSection>
          {model && !isQuantity && (
            <ExpandableSection label={t("inventory.attrSectionTitle")}>
              <AttributeEditor form={form} savedKeys={savedKeys} />
            </ExpandableSection>
          )}

          <div className="space-y-4 pt-1">
            <ModelPictureField
              model={model}
              stagedFile={stagedMainImage}
              onStagedFileChange={setStagedMainImage}
            />
            {!isQuantity && (
              <ColorPicturesField
                model={model}
                colors={colorOptions}
                stagedColorFiles={stagedColorImages}
                onStagedColorChange={(color, file) => {
                  setStagedColorImages((prev) => {
                    if (!file) {
                      const next = { ...prev }
                      delete next[color]
                      return next
                    }
                    return { ...prev, [color]: file }
                  })
                }}
              />
            )}
          </div>

          {model && canManagePrices && <ProductPriceGrid model={model} />}
        </form>
      </div>
      <div className="-mx-5 -mb-6 shrink-0 border-t border-border bg-card px-5 pb-6 pt-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:min-w-28"
            onClick={onDone}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="device-model-form"
            className="w-full sm:w-auto sm:min-w-28"
            disabled={isPending}
          >
            {isPending ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </div>
    </Form>
  )
}

export function DeviceModelDialog({
  model,
  open,
  onOpenChange,
  canManagePrices = false,
}: {
  model: DeviceModelView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManagePrices?: boolean
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className="sm:max-w-5xl max-h-[90vh]"
        contentClassName="flex flex-col overflow-hidden"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{model ? t("inventory.editModel") : t("inventory.newModel")}</DialogTitle>
        </DialogHeader>
        {open && (
          <ModelForm
            key={model?.id ?? "new"}
            model={model}
            canManagePrices={canManagePrices}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
