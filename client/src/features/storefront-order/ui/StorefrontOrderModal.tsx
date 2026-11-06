import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  useCreateStorefrontOrder,
  usePayStorefrontOrder,
  useStorefrontConfig,
} from "@/entities/storefront"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { calculateDeliveryFee } from "../lib/delivery-fee"
import type { CheckoutFormValues } from "./FulfillmentPicker"
import { OrderFormContent } from "./OrderFormContent"
import { OrderSuccessView } from "./OrderSuccessView"

export interface StorefrontOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelId: string
  modelName: string
  variantSpecs?: Record<string, string>
  availableStores: Array<{ id: string; name: string }>
  shopPhone?: string | null
  productPrice?: number | null
}

function useOrderSubmit({
  modelId,
  variantSpecs,
  onOrderSuccess,
}: {
  modelId: string
  variantSpecs?: Record<string, string>
  onOrderSuccess: (orderId: string) => void
}) {
  const { t } = useI18n()
  const createOrder = useCreateStorefrontOrder()
  const payOrder = usePayStorefrontOrder()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = (values: CheckoutFormValues) => {
    setErrorMessage(null)
    const isDelivery = values.fulfillmentMethod === "DELIVERY"
    const isOnline = values.paymentMethod === "ONLINE"

    createOrder.mutate(
      {
        modelId,
        name: values.name.trim(),
        phone: values.phone.trim(),
        fulfillmentMethod: values.fulfillmentMethod,
        storeId: values.storeId || availableStores[0]?.id,
        address: isDelivery ? values.address.trim() : undefined,
        deliveryZoneId: isDelivery && values.deliveryZoneId ? values.deliveryZoneId : undefined,
        paymentMethod: isOnline ? "ONLINE" : "ON_RECEIPT",
        specs: variantSpecs && Object.keys(variantSpecs).length > 0 ? variantSpecs : undefined,
        note: values.note.trim() ? values.note.trim() : undefined,
        hp: values.hp,
      },
      {
        onSuccess: (res) => {
          if (isOnline) {
            payOrder.mutate(
              { id: res.id, provider: values.onlineProvider || undefined },
              {
                onSuccess: (payRes) => {
                  window.location.href = payRes.checkoutUrl
                },
                onError: (payErr: unknown) => {
                  setErrorMessage((payErr as { message?: string })?.message || t("storefront.payRedirectFailed"))
                },
              },
            )
          } else {
            onOrderSuccess(res.id)
          }
        },
        onError: (err: unknown) => {
          const status = (err as { statusCode?: number })?.statusCode
          const msg = (err as { message?: string })?.message
          if (status === 429) {
            setErrorMessage(t("storefront.tooManyRequests"))
          } else if (msg === "OUT_OF_STOCK") {
            setErrorMessage(t("storefront.outOfStock"))
          } else {
            setErrorMessage(msg || t("storefront.orderFailed"))
          }
        },
      },
    )
  }

  return { handleSubmit, errorMessage, isSubmitting: createOrder.isPending || payOrder.isPending }
}

function useCheckoutForm(
  open: boolean,
  defaultMethod: "PICKUP" | "DELIVERY",
  defaultStoreId: string,
) {
  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      name: "",
      phone: "+998",
      fulfillmentMethod: defaultMethod,
      storeId: defaultStoreId,
      address: "",
      deliveryZoneId: "",
      paymentMethod: "ON_RECEIPT",
      onlineProvider: "",
      note: "",
      hp: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        phone: "+998",
        fulfillmentMethod: defaultMethod,
        storeId: defaultStoreId,
        address: "",
        deliveryZoneId: "",
        paymentMethod: "ON_RECEIPT",
        onlineProvider: "",
        note: "",
        hp: "",
      })
    }
  }, [open, defaultMethod, defaultStoreId, form])

  return form
}

export function StorefrontOrderModal({
  open,
  onOpenChange,
  modelId,
  modelName,
  variantSpecs,
  availableStores,
  shopPhone,
  productPrice,
}: StorefrontOrderModalProps) {
  const { t } = useI18n()
  const { data: config } = useStorefrontConfig()
  const [createdOrderId, setCreatedOrderId] = React.useState<string | null>(null)

  const pickupAvailable = config?.pickupEnabled ?? true
  const deliveryAvailable = config?.deliveryEnabled ?? false
  const defaultMethod = pickupAvailable ? "PICKUP" : "DELIVERY"
  const form = useCheckoutForm(open, defaultMethod, availableStores[0]?.id ?? "")

  const { handleSubmit, errorMessage, isSubmitting } = useOrderSubmit({
    modelId,
    variantSpecs,
    onOrderSuccess: (id) => setCreatedOrderId(id),
  })

  const fulfillmentMethod = useWatch({ control: form.control, name: "fulfillmentMethod" })
  const deliveryZoneId = useWatch({ control: form.control, name: "deliveryZoneId" })
  const selectedZone = config?.deliveryZones?.find((z) => z.id === deliveryZoneId)
  const deliveryFee = calculateDeliveryFee({
    fulfillmentMethod,
    pickupEnabled: pickupAvailable,
    deliveryEnabled: deliveryAvailable,
    pricingMode: config?.deliveryPricingMode ?? "FLAT",
    flatFee: config?.deliveryFlatFee,
    freeFrom: config?.deliveryFreeFrom,
    zone: selectedZone,
    orderPrice: productPrice ?? null,
  })

  const specsText = variantSpecs ? Object.values(variantSpecs).filter(Boolean).join(" • ") : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("storefront.orderTitle")}</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{modelName}</span>
            {specsText ? ` (${specsText})` : ""}
          </DialogDescription>
        </DialogHeader>

        {createdOrderId ? (
          <OrderSuccessView
            orderId={createdOrderId}
            shopPhone={shopPhone}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <OrderFormContent
            form={form}
            config={config}
            availableStores={availableStores}
            productPrice={productPrice}
            deliveryFee={deliveryFee}
            hasChoice={pickupAvailable && deliveryAvailable}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
