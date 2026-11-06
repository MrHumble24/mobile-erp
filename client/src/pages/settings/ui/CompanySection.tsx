import { useState } from "react"
import { Button, toast } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
  type UpdateCompanyProfileDto,
} from "@/entities/company"
import { CompanyIdentityCard } from "./company/CompanyIdentityCard"
import { CompanyRegionCard } from "./company/CompanyRegionCard"
import { CompanyThemesCard } from "./company/CompanyThemesCard"
import { CompanyTelegramCard } from "./company/CompanyTelegramCard"

export function CompanySection({ disabled }: { disabled: boolean }) {
  const { t } = useI18n()
  const { data: profile } = useCompanyProfile()
  const updateProfile = useUpdateCompanyProfile()
  const [form, setForm] = useState<UpdateCompanyProfileDto>({})

  const handleChange = (patch: Partial<UpdateCompanyProfileDto>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const handleSaveProfile = () => {
    updateProfile.mutate(form, {
      onSuccess: () => {
        toast.success(t("settings.settingsSaved"))
        setForm({})
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })
  }

  return (
    <div className="space-y-6">
      <CompanyIdentityCard
        profile={profile}
        form={form}
        onChange={handleChange}
        disabled={disabled}
      />
      <CompanyRegionCard
        profile={profile}
        form={form}
        onChange={handleChange}
        disabled={disabled}
      />
      <CompanyThemesCard
        profile={profile}
        form={form}
        onChange={handleChange}
        disabled={disabled}
      />
      <CompanyTelegramCard disabled={disabled} />

      {!disabled && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleSaveProfile}
            disabled={updateProfile.isPending || Object.keys(form).length === 0}
            className="h-10 rounded-full px-7 font-semibold shadow-xs"
          >
            {updateProfile.isPending ? t("settings.saving") : t("common.save")}
          </Button>
        </div>
      )}
    </div>
  )
}
