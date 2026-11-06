import type { UseFormRegister } from "react-hook-form"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useI18n } from "@/shared/i18n"
import type { StorefrontFormValues } from "./types"

interface StorefrontContactFieldsProps {
  register: UseFormRegister<StorefrontFormValues>
  disabled: boolean
}

export function StorefrontContactFields({
  register,
  disabled,
}: StorefrontContactFieldsProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="storefront-phone" className="text-xs font-semibold">
          {t("settings.storefrontPhone")}
        </Label>
        <Input
          id="storefront-phone"
          {...register("contactPhone")}
          placeholder="+998 90 123 45 67"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <Label
          htmlFor="storefront-telegram"
          className="text-xs font-semibold"
        >
          {t("settings.storefrontTelegram")}
        </Label>
        <Input
          id="storefront-telegram"
          {...register("contactTelegram")}
          placeholder="@malikastore"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
