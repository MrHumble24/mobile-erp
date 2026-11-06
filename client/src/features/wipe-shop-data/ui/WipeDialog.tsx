import { useMemo } from "react"
import { useForm, useWatch, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle } from "lucide-react"
import { useSettings } from "@/entities/settings"
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
import { useWipePreview, useWipeShopData } from "../model/use-wipe"
import { makeWipeSchema, type WipeValues } from "../model/wipe.schema"
import { wipeErrorMessage } from "../model/wipe-error"

export interface WipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The clearly-dangerous erase confirmation: what goes, what stays, the two
 * extra boxes with live counts, the shop name, the password, and "I understand".
 * The shop name works like a repository name on GitHub: the dialog shows the
 * exact name to type, and "Erase now" stays off until what is typed matches it.
 * A safety backup is made server-side first; restoring it is the only undo. */
export function WipeDialog({ open, onOpenChange }: WipeDialogProps) {
  const { t } = useI18n()
  const erase = useWipeShopData()
  const { data: preview } = useWipePreview(open)
  const { data: settings } = useSettings()
  // The name to type. While it is not loaded, any typed name is let through and
  // the server decides, exactly as before.
  const expectedName = settings?.storeName?.trim() ?? ""
  const schema = useMemo(() => makeWipeSchema(t), [t])
  const form = useForm<WipeValues>({
    resolver: zodResolver(schema),
    defaultValues: { shopName: "", password: "", understood: false, contacts: false, catalog: false },
  })

  const values = useWatch({ control: form.control })
  const contacts = values.contacts ?? false
  const catalog = values.catalog ?? false
  const nameMatches = expectedName ? values.shopName === expectedName : Boolean(values.shopName)
  const ready = Boolean(nameMatches && values.password && values.understood)

  const total =
    (preview?.always ?? 0) +
    (contacts ? preview?.contacts ?? 0 : 0) +
    (catalog ? preview?.catalog ?? 0 : 0)
  const n = (v: number) => v.toLocaleString()

  const close = () => {
    form.reset({ shopName: "", password: "", understood: false, contacts: false, catalog: false })
    onOpenChange(false)
  }

  const onSubmit = (v: WipeValues) =>
    erase.mutate(
      { shopName: v.shopName, password: v.password, understood: true, contacts: v.contacts, catalog: v.catalog },
      { onSuccess: close, onError: (err) => toast.error(wipeErrorMessage(err, t)) },
    )

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogPopup className="max-w-md border-destructive/40">
        <DialogHeader>
          <div className="size-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
            <AlertTriangle className="size-5 stroke-[2.2]" />
          </div>
          <DialogTitle className="text-destructive">{t("backups.wipeTitle")}</DialogTitle>
          <DialogDescription className="mt-1">{t("backups.wipeWarning")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-[12px] border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold text-destructive">{t("backups.wipeWillErase")}</p>
              <p className="text-muted-foreground mt-1">
                {t("backups.wipeAlways")} · {t("backups.wipeRowsCount", { count: n(preview?.always ?? 0) })}
              </p>

              <ExtraBox control={form.control} name="contacts" label={t("backups.wipeContactsLabel")}
                count={n(preview?.contacts ?? 0)} t={t} />
              <ExtraBox control={form.control} name="catalog" label={t("backups.wipeCatalogLabel")}
                count={n(preview?.catalog ?? 0)} t={t} />

              <p className="font-semibold text-destructive mt-2">
                {t("backups.wipeTotalLabel")}: {t("backups.wipeRowsCount", { count: n(total) })}
              </p>
            </div>

            <div className="rounded-[12px] border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{t("backups.wipeKeptTitle")}</p>
              <p className="mt-1">{t("backups.wipeKept")}</p>
              <p className="mt-2">{t("backups.wipeSafetyNote")}</p>
            </div>

            <FormField control={form.control} name="shopName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">{t("backups.restoreShopNameLabel")}</FormLabel>
                {expectedName && (
                  <p>
                    <code className="select-all rounded-[6px] bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold text-foreground">
                      {expectedName}
                    </code>
                  </p>
                )}
                <FormControl>
                  <Input {...field} autoComplete="off" spellCheck={false}
                    placeholder={expectedName || t("backups.restoreShopNamePlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">{t("backups.restorePasswordLabel")}</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="current-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="understood" render={({ field }) => (
              <FormItem>
                <label className="flex items-start gap-2 cursor-pointer">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                  </FormControl>
                  <span className="text-sm text-muted-foreground">{t("backups.wipeUnderstandLabel")}</span>
                </label>
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={erase.isPending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={erase.isPending || !ready}>
                {erase.isPending ? t("backups.wipeStarting") : t("backups.wipeConfirm")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}

/** One optional extra group: a checkbox whose count folds into the total. */
function ExtraBox({
  control,
  name,
  label,
  count,
  t,
}: {
  control: Control<WipeValues>
  name: "contacts" | "catalog"
  label: string
  count: string
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem className="mt-2">
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
          <span className="text-sm text-foreground">
            {label}{" "}
            <span className="text-muted-foreground">
              · {t("backups.wipeRowsCount", { count })}
            </span>
          </span>
        </label>
      </FormItem>
    )} />
  )
}
