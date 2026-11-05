import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { PRODUCT_KINDS } from "@/entities/device-model"
import { useProductCategories } from "@/entities/product-category"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import type { DeviceModelFormValues } from "../model/device-model-form.schema"

type FormApi = UseFormReturn<DeviceModelFormValues>

/** Sentinel for "no category" — shadcn Select items need a non-empty value. */
const NO_CATEGORY = "__none__"

export function KindField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="kindCode"
      render={({ field }) => {
        const hintKey = PRODUCT_KINDS.find((k) => k.code === field.value)?.hintKey
        return (
          <FormItem>
            <FormLabel>{t("catalog.productKind")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PRODUCT_KINDS.map((k) => (
                  <SelectItem key={k.code} value={k.code}>
                    {t(k.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hintKey && <FormDescription>{t(hintKey)}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function CategoryField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  const { data: categories } = useProductCategories()
  return (
    <FormField
      control={form.control}
      name="categoryId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("catalog.category")}</FormLabel>
          <Select
            value={field.value || NO_CATEGORY}
            onValueChange={(v) => field.onChange(v === NO_CATEGORY ? "" : v)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>{t("catalog.noCategory")}</SelectItem>
              {(categories ?? [])
                .filter((c) => c.isActive || c.id === field.value)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function BarcodeField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="barcode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("catalog.barcode")}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} />
          </FormControl>
          <FormDescription>{t("catalog.barcodeHint")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SalePriceField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="salePrice"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("catalog.salePrice")}</FormLabel>
          <FormControl>
            <Input type="number" min={0} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormDescription>{t("catalog.unitPrice")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ModelCodeField({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="modelCode"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("catalog.modelCode")}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} />
          </FormControl>
          <FormDescription>{t("catalog.modelCodeHint")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
