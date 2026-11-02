import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useSettings, useUpdateSettings, type StoreSettings, type UpdateSettingsDto } from "@/entities/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function StoreTimeFields({
  closingTime,
  setClosingTime,
  defaultWarrantyDays,
  setDefaultWarrantyDays,
}: {
  closingTime: string
  setClosingTime: (v: string) => void
  defaultWarrantyDays: number
  setDefaultWarrantyDays: (v: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>{t("settings.closingTime")}</Label>
        <Input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>{t("settings.defaultWarrantyDays")}</Label>
        <Input
          type="number"
          min={0}
          value={defaultWarrantyDays}
          onChange={(e) => setDefaultWarrantyDays(Number(e.target.value))}
          required
        />
      </div>
    </div>
  )
}

function StoreThresholdFields({
  minMarginPercent,
  setMinMarginPercent,
  lowStockThreshold,
  setLowStockThreshold,
}: {
  minMarginPercent: string | number
  setMinMarginPercent: (v: number) => void
  lowStockThreshold: number
  setLowStockThreshold: (v: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>{t("settings.minMarginPercent")}</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={minMarginPercent}
          onChange={(e) => setMinMarginPercent(Number(e.target.value))}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>{t("settings.lowStockThreshold")}</Label>
        <Input
          type="number"
          min={0}
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(Number(e.target.value))}
          required
        />
      </div>
    </div>
  )
}

function TelegramChatField({
  value,
  onChange,
}: {
  value: string | null
  onChange: (val: string | null) => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label>{t("settings.telegramChatId")}</Label>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="-1001234567890"
        className="font-mono"
      />
    </div>
  )
}

function SettingsFields({
  form,
  setForm,
}: {
  form: StoreSettings
  setForm: React.Dispatch<React.SetStateAction<StoreSettings>>
}) {
  return (
    <div className="space-y-4">
      <TelegramChatField
        value={form.telegramChatId}
        onChange={(v) => setForm((p) => ({ ...p, telegramChatId: v }))}
      />
      <StoreTimeFields
        closingTime={form.closingTime}
        setClosingTime={(v) => setForm((p) => ({ ...p, closingTime: v }))}
        defaultWarrantyDays={form.defaultWarrantyDays}
        setDefaultWarrantyDays={(v) => setForm((p) => ({ ...p, defaultWarrantyDays: v }))}
      />
      <StoreThresholdFields
        minMarginPercent={form.minMarginPercent}
        setMinMarginPercent={(v) => setForm((p) => ({ ...p, minMarginPercent: v }))}
        lowStockThreshold={form.lowStockThreshold}
        setLowStockThreshold={(v) => setForm((p) => ({ ...p, lowStockThreshold: v }))}
      />
    </div>
  )
}

function SettingsForm({
  initialSettings,
  canManage,
}: {
  initialSettings: StoreSettings
  canManage: boolean
}) {
  const { t } = useI18n()
  const updateMutation = useUpdateSettings()
  const [form, setForm] = React.useState<StoreSettings>(initialSettings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dto: UpdateSettingsDto = {
      telegramChatId: form.telegramChatId,
      closingTime: form.closingTime,
      defaultWarrantyDays: Number(form.defaultWarrantyDays),
      minMarginPercent: Number(form.minMarginPercent),
      lowStockThreshold: Number(form.lowStockThreshold),
    }

    updateMutation.mutate(dto, {
      onSuccess: () => toast.success(t("settings.settingsSaved")),
      onError: (err: any) => toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsFields form={form} setForm={setForm} />
      {canManage && (
        <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
          {updateMutation.isPending ? t("settings.saving") : t("common.save")}
        </Button>
      )}
    </form>
  )
}

export function SettingsPage() {
  const { t } = useI18n()
  const canManage = useAuthStore(
    (s) => s.user?.permissions?.includes("settings.manage") ?? false
  )
  const { data: settings, isLoading } = useSettings()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.storeSettings")}</CardTitle>
          <CardDescription>Malika ERP do'kon konfiguratsiyasi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          {settings && <SettingsForm initialSettings={settings} canManage={canManage} />}
        </CardContent>
      </Card>
    </div>
  )
}
