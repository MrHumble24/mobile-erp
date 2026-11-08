import { type UseFormReturn } from "react-hook-form"
import { Info, Link2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { CurrentPriceList } from "@/entities/customs"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { validateRows, type CreatePriceListValues } from "../model/create-price-list.schema"
import { useCreatePriceListForm } from "../model/use-create-price-list-form"
import { PriceListRowsField } from "./PriceListRowsField"

const CARD = "rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]"

function MetaFields({ form }: { form: UseFormReturn<CreatePriceListValues> }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="effectiveAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customs.effectiveAt")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("customs.note")}</FormLabel>
            <FormControl>
              <Textarea rows={1} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

/** Plain-language explanation shown before the first row — no hidden knowledge assumed. */
function HowItWorksGuide() {
  const { t } = useI18n()
  return (
    <div className="space-y-1.5 rounded-[16px] border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-1.5">
        <Info className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold">{t("customs.guideTitle")}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("customs.guideText")}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("customs.chipsHint")}</p>
    </div>
  )
}

/** One stable status line: how many rows, how many connected, how many suggestions. */
function RowsStatusBar({
  rows,
  connected,
  suggestions,
  canLink,
  onLinkAll,
}: {
  rows: number
  connected: number
  suggestions: number
  canLink: boolean
  onLinkAll: () => void
}) {
  const { t } = useI18n()
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border bg-muted/40 px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-foreground">
        {t("customs.rowsSummary", { rows, linked: connected, suggestions })}
      </p>
      {canLink && suggestions > 0 && (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onLinkAll}>
          <Link2 className="size-3.5" aria-hidden="true" />
          {t("customs.linkAll", { count: suggestions })}
        </Button>
      )}
    </div>
  )
}

/** Explains why linking is hidden or delayed, instead of silently omitting it. */
function StatusNotes({
  canLink,
  modelsLoading,
  modelsError,
}: {
  canLink: boolean
  modelsLoading: boolean
  modelsError: boolean
}) {
  const { t } = useI18n()
  if (!canLink) return <Note text={t("customs.noPermission")} />
  if (modelsLoading) return <Note text={t("customs.modelsLoading")} />
  if (modelsError) return <Note text={t("customs.modelsUnavailable")} />
  return null
}

function Note({ text }: { text: string }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
}

/** Saving also edits models — the consequence is stated next to the button, not in a tooltip. */
function SaveSection({
  pendingLinks,
  isPending,
  onCancel,
}: {
  pendingLinks: number
  isPending: boolean
  onCancel: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {pendingLinks > 0
          ? t("customs.saveConsequence", { count: pendingLinks })
          : t("customs.saveConsequenceNone")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("common.loading") : t("customs.saveList")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  )
}

type FormState = ReturnType<typeof useCreatePriceListForm>

function RowsSection({ state, current }: { state: FormState; current: CurrentPriceList | null }) {
  const { t } = useI18n()
  const { form, links, models, canLink } = state
  return (
    <section className={CARD}>
      {current && (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {t("customs.prefilledHint")}
        </p>
      )}
      <PriceListRowsField
        form={form}
        models={models}
        pending={links.pending}
        canLink={canLink}
        onLink={links.linkRow}
        onUnlink={links.unlinkRow}
        onRowsFromFile={links.applyFileLinks}
      />
    </section>
  )
}

function FooterSection({ state, onCancel }: { state: FormState; onCancel: () => void }) {
  const { items, links, canLink, isPending } = state
  return (
    <section className={`${CARD} space-y-3`}>
      <RowsStatusBar
        rows={items.length}
        connected={links.connected}
        suggestions={links.suggestions}
        canLink={canLink}
        onLinkAll={links.linkAll}
      />
      <SaveSection pendingLinks={links.ready} isPending={isPending} onCancel={onCancel} />
    </section>
  )
}

function FormBody({
  state,
  current,
  onCancel,
  onSubmit,
}: {
  state: FormState
  current: CurrentPriceList | null
  onCancel: () => void
  onSubmit: (values: CreatePriceListValues) => void
}) {
  const { t } = useI18n()
  const { form, modelsQuery, canLink } = state
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
        <HowItWorksGuide />
        <StatusNotes
          canLink={canLink}
          modelsLoading={modelsQuery.isLoading}
          modelsError={modelsQuery.isError}
        />
        <section className={CARD} aria-label={t("customs.effectiveAt")}>
          <MetaFields form={form} />
        </section>
        <RowsSection state={state} current={current} />
        <FooterSection state={state} onCancel={onCancel} />
      </form>
    </Form>
  )
}

/**
 * The full create-list flow on its own page (not a dialog): guide, metadata,
 * rows with model linking, a live status bar and a save section that states
 * the consequence of saving. On success the page navigates back to /customs.
 */
export function CreatePriceListForm({
  current,
  onSaved,
  onCancel,
}: {
  current: CurrentPriceList | null
  onSaved: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const state = useCreatePriceListForm(current, onSaved)
  const onSubmit = (values: CreatePriceListValues) => {
    const rowError = validateRows(values.items)
    if (rowError === "empty") return toast.error(t("customs.errorNoRows"))
    if (rowError === "duplicate") return toast.error(t("customs.errorDuplicateCode"))
    state.submit(values, state.links.assignments)
  }
  return <FormBody state={state} current={current} onCancel={onCancel} onSubmit={onSubmit} />
}
