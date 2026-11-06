import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { CompanyProfile, UpdateCompanyProfileDto } from "@/entities/company"

interface CompanyRegionCardProps {
  profile?: CompanyProfile
  form: UpdateCompanyProfileDto
  onChange: (patch: Partial<UpdateCompanyProfileDto>) => void
  disabled: boolean
}

export function CompanyRegionCard({
  profile,
  form,
  onChange,
  disabled,
}: CompanyRegionCardProps) {
  const { t } = useI18n()

  const currencyCode = form.currencyCode ?? profile?.currencyCode ?? "USD"
  const currencySign = form.currencySign ?? profile?.currencySign ?? "$"
  const currencySignPosition = form.currencySignPosition ?? profile?.currencySignPosition ?? "before"
  const currencyDecimals = form.currencyDecimals ?? profile?.currencyDecimals ?? 2
  const country = form.country ?? profile?.country ?? "UZ"
  const timeZone = form.timeZone ?? profile?.timeZone ?? "Asia/Tashkent"
  const sessionDuration = form.sessionDuration ?? profile?.sessionDuration ?? "12h"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("setup.regionTitle")}</CardTitle>
        <CardDescription className="text-xs">{t("setup.regionSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.currencyCode")}</label>
            <Input
              value={currencyCode}
              disabled={disabled}
              onChange={(e) => onChange({ currencyCode: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.currencySign")}</label>
            <Input
              value={currencySign}
              disabled={disabled}
              onChange={(e) => onChange({ currencySign: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.currencySignPosition")}</label>
            <Select
              value={currencySignPosition}
              disabled={disabled}
              onValueChange={(val) => {
                if (val === "before" || val === "after") {
                  onChange({ currencySignPosition: val })
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">{t("setup.signBefore")}</SelectItem>
                <SelectItem value="after">{t("setup.signAfter")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.currencyDecimals")}</label>
            <Select
              value={String(currencyDecimals)}
              disabled={disabled}
              onValueChange={(val) => {
                if (val !== null) {
                  onChange({ currencyDecimals: Number(val) })
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("setup.decimalsZero")}</SelectItem>
                <SelectItem value="2">{t("setup.decimalsTwo")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.country")}</label>
            <Input
              value={country}
              disabled={disabled}
              onChange={(e) => onChange({ country: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.timeZone")}</label>
            <Input
              value={timeZone}
              disabled={disabled}
              onChange={(e) => onChange({ timeZone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t("settings.sessionDuration")}</label>
            <Input
              value={sessionDuration}
              disabled={disabled}
              onChange={(e) => onChange({ sessionDuration: e.target.value })}
              placeholder="12h"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
