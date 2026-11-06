import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
  FilePicker,
  toast,
} from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import {
  useUploadLogo,
  type CompanyProfile,
  type UpdateCompanyProfileDto,
} from "@/entities/company"
import { AssetImage } from "@/shared/ui"

interface CompanyIdentityCardProps {
  profile?: CompanyProfile
  form: UpdateCompanyProfileDto
  onChange: (patch: Partial<UpdateCompanyProfileDto>) => void
  disabled: boolean
}

export function CompanyIdentityCard({
  profile,
  form,
  onChange,
  disabled,
}: CompanyIdentityCardProps) {
  const { t } = useI18n()
  const uploadLogo = useUploadLogo()

  const name = form.name ?? profile?.name ?? ""
  const legalName = form.legalName ?? profile?.legalName ?? ""
  const address = form.address ?? profile?.address ?? ""
  const phone = form.phone ?? profile?.phone ?? ""

  const handleFilePicked = (file: File) => {
    if (file.type === "image/svg+xml") {
      toast.error(t("settings.logoDesc"))
      return
    }
    uploadLogo.mutate(file, {
      onSuccess: () => toast.success(t("settings.logoSaved") || "Logo uploaded successfully"),
      onError: (err: Error) => toast.error(err.message || "Failed to upload logo"),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("settings.companyTitle")}</CardTitle>
        <CardDescription className="text-xs">{t("settings.companySubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="space-y-2">
            <label className="text-xs font-semibold">{t("settings.logo")}</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/20">
                {profile?.logoUrl ? (
                  <AssetImage path={profile.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-muted-foreground text-center px-1">No Logo</span>
                )}
              </div>
              {!disabled && (
                <div className="space-y-1">
                  <FilePicker
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploadLogo.isPending}
                    onPick={handleFilePicked}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadLogo.isPending}
                      className="h-8 rounded-full text-xs"
                    >
                      {uploadLogo.isPending ? "Uploading..." : t("settings.uploadLogo")}
                    </Button>
                  </FilePicker>
                  <p className="text-[11px] text-muted-foreground">{t("settings.logoDesc")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t("settings.companyName")}</label>
                <Input
                  value={name}
                  disabled={disabled}
                  onChange={(e) => onChange({ name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t("settings.legalName")}</label>
                <Input
                  value={legalName}
                  disabled={disabled}
                  onChange={(e) => onChange({ legalName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t("settings.companyAddress")}</label>
                <Input
                  value={address}
                  disabled={disabled}
                  onChange={(e) => onChange({ address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t("settings.companyPhone")}</label>
                <Input
                  value={phone}
                  disabled={disabled}
                  onChange={(e) => onChange({ phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
