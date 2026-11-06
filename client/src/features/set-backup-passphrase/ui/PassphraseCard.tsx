import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSetPassphrase, type BackupSettingsView } from "@/entities/backup"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/sonner"
import { makePassphraseSchema, type PassphraseValues } from "../model/passphrase.schema"

const STATUS_BADGE: Record<string, { variant: "emerald" | "amber" | "destructive"; key: string }> = {
  set: { variant: "emerald", key: "backups.passphraseStateSet" },
  missing: { variant: "amber", key: "backups.passphraseStateMissing" },
  unreadable: { variant: "destructive", key: "backups.passphraseStateUnreadable" },
}

export function PassphraseCard({
  settings,
  canManage,
}: {
  settings: BackupSettingsView
  canManage: boolean
}) {
  const { t } = useI18n()
  const setPassphrase = useSetPassphrase()
  const schema = useMemo(() => makePassphraseSchema(t), [t])
  const form = useForm<PassphraseValues>({
    resolver: zodResolver(schema),
    defaultValues: { passphrase: "", confirm: "" },
  })

  const badge = STATUS_BADGE[settings.passphraseStatus] ?? STATUS_BADGE.missing

  const onSubmit = (values: PassphraseValues) =>
    setPassphrase.mutate(values.passphrase, {
      onSuccess: () => {
        toast.success(t("backups.passphraseSaved"))
        form.reset({ passphrase: "", confirm: "" })
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="size-4" />
            {t("backups.passphraseTitle")}
          </CardTitle>
          <Badge variant={badge.variant}>{t(badge.key)}</Badge>
        </div>
        <CardDescription>{t(`backups.passphraseDesc_${settings.passphraseStatus}`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{t("backups.passphraseWarning")}</span>
        </div>
        {canManage && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      {t("backups.passphraseLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      {t("backups.passphraseConfirmLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={setPassphrase.isPending}
                className="h-9 rounded-full px-5 text-xs font-semibold"
              >
                {setPassphrase.isPending ? t("backups.saving") : t("backups.passphraseSave")}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
