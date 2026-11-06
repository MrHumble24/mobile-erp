import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import {
  useRestoreFromRun,
  useRestoreFromUpload,
  backupErrorMessage,
} from "@/entities/backup"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/sonner"
import { makeRestoreSchema, type RestoreValues } from "../model/restore.schema"
import type { RestoreSource } from "../model/restore.types"

export interface RestoreDialogProps {
  source: RestoreSource | null
  backupDate: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The clearly-dangerous restore confirmation: what is replaced, from which
 * date, the shop name typed exactly, and the owner's password. */
export function RestoreDialog({ source, backupDate, open, onOpenChange }: RestoreDialogProps) {
  const { t } = useI18n()
  const fromRun = useRestoreFromRun()
  const fromUpload = useRestoreFromUpload()
  const schema = useMemo(() => makeRestoreSchema(t), [t])
  const form = useForm<RestoreValues>({
    resolver: zodResolver(schema),
    defaultValues: { shopName: "", password: "" },
  })
  const pending = fromRun.isPending || fromUpload.isPending

  const close = () => {
    form.reset({ shopName: "", password: "" })
    onOpenChange(false)
  }

  const onSubmit = (values: RestoreValues) => {
    if (!source) return
    const onError = (err: Error) => toast.error(backupErrorMessage(err, t))
    const onSuccess = () => close()
    if (source.kind === "run") {
      fromRun.mutate({ id: source.id, dto: values }, { onSuccess, onError })
    } else {
      fromUpload.mutate({ uploadId: source.uploadId, dto: values }, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogPopup className="max-w-md border-destructive/40">
        <DialogHeader>
          <div className="size-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
            <AlertTriangle className="size-5 stroke-[2.2]" />
          </div>
          <DialogTitle className="text-destructive">{t("backups.restoreTitle")}</DialogTitle>
          <DialogDescription className="mt-1">
            {t("backups.restoreWarning")}
            {backupDate ? ` ${t("backups.restoreFromDate", { date: formatDateTime(backupDate) })}` : ""}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    {t("backups.restoreShopNameLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" placeholder={t("backups.restoreShopNamePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    {t("backups.restorePasswordLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="current-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={pending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={pending || !source}>
                {pending ? t("backups.restoreStarting") : t("backups.restoreConfirm")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}
