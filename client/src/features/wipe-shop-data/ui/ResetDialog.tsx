import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertOctagon } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/sonner"
import { useFactoryReset } from "../model/use-wipe"
import { makeResetSchema, type ResetValues } from "../model/reset.schema"
import { wipeErrorMessage } from "../model/wipe-error"

export interface ResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Factory reset dialog: permanently erases everything and returns the system
 * to first-boot onboarding. Requires all four confirmations before anything
 * can be submitted.
 */
export function ResetDialog({ open, onOpenChange }: ResetDialogProps) {
  const { t } = useI18n()
  const resetMutation = useFactoryReset()
  const schema = useMemo(() => makeResetSchema(t), [t])
  const form = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { shopName: "", password: "", sentence: "", understood: false },
  })

  const values = useWatch({ control: form.control })
  const ready = Boolean(
    values.shopName &&
    values.password &&
    values.sentence?.trim() === "erase everything" &&
    values.understood,
  )

  const close = () => {
    form.reset({ shopName: "", password: "", sentence: "", understood: false })
    onOpenChange(false)
  }

  const onSubmit = (v: ResetValues) =>
    resetMutation.mutate(
      { shopName: v.shopName, password: v.password, sentence: v.sentence, understood: true },
      { onSuccess: close, onError: (err) => toast.error(wipeErrorMessage(err, t)) },
    )

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogPopup className="max-w-md border-destructive/60">
        <DialogHeader>
          <div className="size-11 rounded-full bg-destructive/15 flex items-center justify-center text-destructive mb-2">
            <AlertOctagon className="size-6 stroke-[2.2]" />
          </div>
          <DialogTitle className="text-destructive font-bold">{t("backups.resetDialogTitle")}</DialogTitle>
          <DialogDescription className="mt-1">{t("backups.resetDialogWarning")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-[12px] border border-destructive/40 bg-destructive/10 p-3.5 text-xs space-y-2">
              <p className="font-bold text-destructive text-sm">{t("backups.resetPlainWordsTitle")}</p>
              <ul className="list-disc pl-4 space-y-1.5 text-destructive font-medium">
                <li>{t("backups.resetPointAccounts")}</li>
                <li>{t("backups.resetPointSafety")}</li>
                <li>{t("backups.resetPointSetupCode")}</li>
                <li>{t("backups.resetPointPhoneApps")}</li>
              </ul>
            </div>

            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">{t("backups.restoreShopNameLabel")}</FormLabel>
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
                  <FormLabel className="text-xs font-semibold">{t("backups.restorePasswordLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="current-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sentence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">{t("backups.resetSentenceLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" placeholder={t("backups.resetSentencePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="understood"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                    </FormControl>
                    <span className="text-xs font-medium text-destructive leading-tight">
                      {t("backups.resetUnderstandLabel")}
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={resetMutation.isPending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={resetMutation.isPending || !ready}>
                {resetMutation.isPending ? t("backups.resetStarting") : t("backups.resetConfirm")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}
