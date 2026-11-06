import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useUpdateBackupSettings, type BackupSettingsView } from "@/entities/backup"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/sonner"
import { makeScheduleSchema, toUpdateDto, type ScheduleValues } from "../model/schedule.schema"

export function ScheduleCard({
  settings,
  canManage,
}: {
  settings: BackupSettingsView
  canManage: boolean
}) {
  const { t } = useI18n()
  const update = useUpdateBackupSettings()
  const schema = useMemo(() => makeScheduleSchema(t), [t])
  const form = useForm<ScheduleValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduleEnabled: settings.scheduleEnabled,
      scheduleTime: settings.scheduleTime,
      keepLast: String(settings.keepLast),
    },
  })
  const enabled = useWatch({ control: form.control, name: "scheduleEnabled" })

  const onSubmit = (values: ScheduleValues) =>
    update.mutate(toUpdateDto(values), {
      onSuccess: () => {
        toast.success(t("backups.scheduleSaved"))
        form.reset(values)
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="size-4" />
          {t("backups.scheduleTitle")}
        </CardTitle>
        <CardDescription>{t("backups.scheduleDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="scheduleEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3 space-y-0">
                  <FormLabel className="text-xs font-semibold">
                    {t("backups.scheduleEnabledLabel")}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canManage}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduleTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      {t("backups.scheduleTimeLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="time" disabled={!canManage || !enabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keepLast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      {t("backups.keepLastLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={1} max={365} disabled={!canManage} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {canManage && (
              <Button
                type="submit"
                disabled={update.isPending || !form.formState.isDirty}
                className="h-9 rounded-full px-5 text-xs font-semibold"
              >
                {update.isPending ? t("backups.saving") : t("common.save")}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
