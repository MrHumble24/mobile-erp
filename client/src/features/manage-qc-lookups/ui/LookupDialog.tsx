import * as React from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import type { CreateLookupDto, LookupView, UpdateLookupDto } from "@/entities/qc"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { lookupFormSchema, toCode, type LookupFormValues } from "../model/lookup-form.schema"

type Opts = { onSuccess?: () => void; onError?: (e: { statusCode?: number; message?: string }) => void }
export interface CreateMut { mutate: (dto: CreateLookupDto, opts?: Opts) => void; isPending: boolean }
export interface UpdateMut { mutate: (v: { code: string; dto: UpdateLookupDto }, opts?: Opts) => void; isPending: boolean }

function codeError(message: string | undefined, t: (k: string) => string): string | undefined {
  if (message === "code-format") return t("qc.codeFormat")
  if (message === "duplicate") return t("qc.codeDuplicate")
  return undefined
}

function CodeLabelFields({
  form,
  editing,
  onLabelChange,
  onCodeEdited,
}: {
  form: UseFormReturn<LookupFormValues>
  editing: boolean
  onLabelChange: (v: string) => void
  onCodeEdited: () => void
}) {
  const { t } = useI18n()
  return (
    <>
      <FormField
        control={form.control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("qc.lookupLabel")}</FormLabel>
            <FormControl>
              <Input {...field} onChange={(e) => { field.onChange(e); onLabelChange(e.target.value) }} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("qc.lookupCode")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={editing}
                className="font-mono"
                onChange={(e) => { field.onChange(e); onCodeEdited() }}
              />
            </FormControl>
            <FormMessage>{codeError(form.formState.errors.code?.message, t)}</FormMessage>
          </FormItem>
        )}
      />
    </>
  )
}

function MetaFields({ form, editing }: { form: UseFormReturn<LookupFormValues>; editing: boolean }) {
  const { t } = useI18n()
  return (
    <>
      <FormField
        control={form.control}
        name="sortOrder"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("qc.sortOrder")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                value={field.value}
                onChange={(e) => field.onChange(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {editing && (
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-[12px] border border-border bg-muted p-3">
              <FormLabel className="mb-0">{t("qc.active")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </>
  )
}

function LookupForm({
  editing,
  create,
  update,
  onDone,
}: {
  editing: LookupView | null
  create: CreateMut
  update: UpdateMut
  onDone: () => void
}) {
  const { t } = useI18n()
  const codeDirty = React.useRef(false)
  const form = useForm<LookupFormValues>({
    resolver: zodResolver(lookupFormSchema),
    defaultValues: editing
      ? { code: editing.code, label: editing.label, sortOrder: editing.sortOrder, isActive: editing.isActive }
      : { code: "", label: "", sortOrder: 0, isActive: true },
  })

  const onLabelChange = (label: string) => {
    if (editing || codeDirty.current) return
    form.setValue("code", toCode(label))
  }

  const handleError = (err: { statusCode?: number }) => {
    if (err?.statusCode === 409) form.setError("code", { message: "duplicate" })
    else toast.error(t("common.error"))
  }

  const onSubmit = (values: LookupFormValues) => {
    const done = { onSuccess: () => { toast.success(t("common.success")); onDone() }, onError: handleError }
    if (editing) update.mutate({ code: editing.code, dto: { label: values.label, sortOrder: values.sortOrder, isActive: values.isActive } }, done)
    else create.mutate({ code: values.code, label: values.label, sortOrder: values.sortOrder }, done)
  }

  const isPending = create.isPending || update.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <CodeLabelFields
          form={form}
          editing={Boolean(editing)}
          onLabelChange={onLabelChange}
          onCodeEdited={() => { codeDirty.current = true }}
        />
        <MetaFields form={form} editing={Boolean(editing)} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function LookupDialog({
  title,
  open,
  onOpenChange,
  editing,
  create,
  update,
}: {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: LookupView | null
  create: CreateMut
  update: UpdateMut
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <LookupForm
            key={editing?.code ?? "new"}
            editing={editing}
            create={create}
            update={update}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
