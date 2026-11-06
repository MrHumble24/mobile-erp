import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { CheckCircle2, PhoneCall } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useCreateStorefrontOrder } from "@/entities/storefront"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

export interface StorefrontOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelId: string
  modelName: string
  variantSpecs?: Record<string, string>
  availableStores: Array<{ id: string; name: string }>
  shopPhone?: string | null
}

interface OrderFormValues {
  name: string
  phone: string
  storeId: string
  note: string
  hp: string
}

export function StorefrontOrderModal({
  open,
  onOpenChange,
  modelId,
  modelName,
  variantSpecs,
  availableStores,
  shopPhone,
}: StorefrontOrderModalProps) {
  const { t } = useI18n()
  const createOrder = useCreateStorefrontOrder()
  const [success, setSuccess] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const defaultStoreId = availableStores[0]?.id ?? ""

  const form = useForm<OrderFormValues>({
    defaultValues: {
      name: "",
      phone: "+998",
      storeId: defaultStoreId,
      note: "",
      hp: "",
    },
  })

  const storeIdValue = useWatch({ control: form.control, name: "storeId" })

  React.useEffect(() => {
    if (open) {
      setSuccess(false)
      setErrorMessage(null)
      form.reset({
        name: "",
        phone: "+998",
        storeId: availableStores[0]?.id ?? "",
        note: "",
        hp: "",
      })
    }
  }, [open, availableStores, form])

  const onSubmit = (values: OrderFormValues) => {
    setErrorMessage(null)
    createOrder.mutate(
      {
        modelId,
        name: values.name.trim(),
        phone: values.phone.trim(),
        storeId: values.storeId,
        specs: variantSpecs && Object.keys(variantSpecs).length > 0 ? variantSpecs : undefined,
        note: values.note.trim() ? values.note.trim() : undefined,
        hp: values.hp,
      },
      {
        onSuccess: () => {
          setSuccess(true)
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
      }
    )
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const specsText = variantSpecs ? Object.values(variantSpecs).filter(Boolean).join(" • ") : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("storefront.orderTitle")}</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{modelName}</span>
            {specsText ? ` (${specsText})` : ""}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">{t("storefront.orderSuccessTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("storefront.orderSuccessMessage")}</p>
            </div>
            {shopPhone && (
              <a
                href={`tel:${shopPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted font-mono font-semibold text-sm hover:bg-muted/80 transition-colors"
              >
                <PhoneCall className="size-4 text-emerald-600" />
                <span>{shopPhone}</span>
              </a>
            )}
            <DialogFooter className="pt-2">
              <Button onClick={handleClose} className="w-full">
                {t("storefront.close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot field for bot protection */}
            <Input
              type="text"
              {...form.register("hp")}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="space-y-1">
              <Label htmlFor="order-name">{t("storefront.name")} *</Label>
              <Input
                id="order-name"
                {...form.register("name", { required: true })}
                placeholder={t("storefront.namePlaceholder")}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="order-phone">{t("storefront.phone")} *</Label>
              <Input
                id="order-phone"
                type="tel"
                {...form.register("phone", { required: true })}
                placeholder={t("storefront.phonePlaceholder")}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="order-store">{t("storefront.branch")} *</Label>
              <Select
                value={storeIdValue}
                onValueChange={(val) => {
                  if (val) form.setValue("storeId", val, { shouldDirty: true })
                }}
              >
                <SelectTrigger id="order-store">
                  <SelectValue placeholder={t("storefront.selectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {availableStores.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="order-note">{t("storefront.note")}</Label>
              <Textarea
                id="order-note"
                {...form.register("note")}
                placeholder={t("storefront.notePlaceholder")}
                rows={2}
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={createOrder.isPending || availableStores.length === 0}
                className="w-full"
              >
                {createOrder.isPending ? t("storefront.submitting") : t("storefront.orderNow")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogPopup>
    </Dialog>
  )
}
