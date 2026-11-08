import {
  type CompanyProfile,
  type UpdateCompanyProfileDto,
} from "@/entities/company"
import type { SettingsForm } from "../model/settings-form.types"
import type { SettingsCategoryMeta } from "../model/settings-categories"
import {
  StoreIdentitySection,
  SalesSection,
  DiscountsSection,
  CustomerCreditSection,
  NasiyaSection,
  ShiftsSection,
  RepairsSection,
  TelegramSection,
} from "./SettingsSections"
import { BonusSection } from "./BonusSection"
import { PrintingSection } from "./PrintingSection"
import { CompanyIdentityCard } from "./company/CompanyIdentityCard"
import { CompanyRegionCard } from "./company/CompanyRegionCard"
import { CompanyThemesCard } from "./company/CompanyThemesCard"
import { CompanyTelegramCard } from "./company/CompanyTelegramCard"
import { StorefrontSection } from "./StorefrontSection"
import { StorefrontDeliverySection } from "./StorefrontDeliverySection"
import { StorefrontPaymentSection } from "./StorefrontPaymentSection"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"

export interface SettingsDetailPaneProps {
  category: SettingsCategoryMeta
  branchForm: SettingsForm
  branchDisabled: boolean
  companyProfile?: CompanyProfile
  companyForm: UpdateCompanyProfileDto
  onCompanyChange: (patch: Partial<UpdateCompanyProfileDto>) => void
  onSaveCompany: () => void
  companyIsPending: boolean
  canManage: boolean
}

export function SettingsDetailPane({
  category,
  branchForm,
  branchDisabled,
  companyProfile,
  companyForm,
  onCompanyChange,
  onSaveCompany,
  companyIsPending,
  canManage,
}: SettingsDetailPaneProps) {
  const { t } = useI18n()

  switch (category.id) {
    case "identity":
      return (
        <div className="space-y-6">
          <StoreIdentitySection form={branchForm} disabled={branchDisabled} />
          <CompanyIdentityCard
            profile={companyProfile}
            form={companyForm}
            onChange={onCompanyChange}
            disabled={branchDisabled}
          />
          {canManage && Object.keys(companyForm).length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={onSaveCompany}
                disabled={companyIsPending}
                size="sm"
                className="h-9 rounded-full px-5 text-xs font-semibold shadow-xs"
              >
                {companyIsPending ? t("settings.saving") : t("common.save")}
              </Button>
            </div>
          )}
        </div>
      )

    case "region":
      return (
        <div className="space-y-6">
          <CompanyRegionCard
            profile={companyProfile}
            form={companyForm}
            onChange={onCompanyChange}
            disabled={branchDisabled}
          />
          {canManage && Object.keys(companyForm).length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={onSaveCompany}
                disabled={companyIsPending}
                size="sm"
                className="h-9 rounded-full px-5 text-xs font-semibold shadow-xs"
              >
                {companyIsPending ? t("settings.saving") : t("common.save")}
              </Button>
            </div>
          )}
        </div>
      )

    case "appearance":
      return (
        <div className="space-y-6">
          <CompanyThemesCard
            profile={companyProfile}
            form={companyForm}
            onChange={onCompanyChange}
            disabled={branchDisabled}
          />
          {canManage && Object.keys(companyForm).length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={onSaveCompany}
                disabled={companyIsPending}
                size="sm"
                className="h-9 rounded-full px-5 text-xs font-semibold shadow-xs"
              >
                {companyIsPending ? t("settings.saving") : t("common.save")}
              </Button>
            </div>
          )}
        </div>
      )

    case "sales":
      return <SalesSection form={branchForm} disabled={branchDisabled} />

    case "discounts":
      return <DiscountsSection form={branchForm} disabled={branchDisabled} />

    case "printing":
      return <PrintingSection form={branchForm} disabled={branchDisabled} />

    case "credit":
      return <CustomerCreditSection form={branchForm} disabled={branchDisabled} />

    case "bonus":
      return <BonusSection form={branchForm} disabled={branchDisabled} />

    case "nasiya":
      return <NasiyaSection form={branchForm} disabled={branchDisabled} />

    case "shifts":
      return <ShiftsSection form={branchForm} disabled={branchDisabled} />

    case "repairs":
      return <RepairsSection form={branchForm} disabled={branchDisabled} />

    case "storefront":
      return <StorefrontSection disabled={branchDisabled} />

    case "delivery":
      return <StorefrontDeliverySection disabled={branchDisabled} />

    case "payments":
      return <StorefrontPaymentSection disabled={branchDisabled} />

    case "telegram":
      return (
        <div className="space-y-6">
          <CompanyTelegramCard disabled={branchDisabled} />
          <TelegramSection form={branchForm} disabled={branchDisabled} />
        </div>
      )

    default:
      return null
  }
}

