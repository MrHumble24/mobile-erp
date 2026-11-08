import { useRef } from "react"
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form"
import { Plus, Trash2, Upload } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { DeviceModelView } from "@/entities/device-model"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import { normalizeCustomsKey } from "../model/model-match"
import {
  emptyRow,
  type CreatePriceListValues,
  type PriceListRow,
} from "../model/create-price-list.schema"
import { usePriceListFile } from "../model/use-price-list-file"
import { RowModelLinks } from "./RowModelLinks"

type Form = UseFormReturn<CreatePriceListValues>

export interface PriceListRowsFieldProps {
  form: Form
  models: DeviceModelView[]
  /** modelIds pending to be linked, keyed by the row's normalized code. */
  pending: Record<string, string[]>
  canLink: boolean
  onLink: (code: string, modelId: string) => void
  onUnlink: (code: string, modelId: string) => void
  /** Fired after a file's rows replace the form rows (drives auto-linking). */
  onRowsFromFile: (rows: PriceListRow[]) => void
}

function RowInput({
  form,
  index,
  field,
  label,
  placeholder,
  type,
}: {
  form: Form
  index: number
  field: "customsCode" | "description" | "fee"
  label: string
  placeholder: string
  type?: "number"
}) {
  return (
    <FormField
      control={form.control}
      name={`items.${index}.${field}` as const}
      render={({ field: f }) => (
        <FormItem className="min-w-0 flex-1">
          <FormLabel className="text-[11px] text-muted-foreground sm:hidden">{label}</FormLabel>
          <FormControl>
            <Input
              {...f}
              value={f.value ?? ""}
              type={type}
              min={type === "number" ? 0 : undefined}
              placeholder={placeholder}
              className="h-9"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function RowDeleteButton({ onRemove }: { onRemove: () => void }) {
  const { t } = useI18n()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 self-end text-destructive sm:self-start"
      onClick={onRemove}
      aria-label={t("customs.removeRow")}
      title={t("customs.removeRow")}
    >
      <Trash2 className="size-4" />
    </Button>
  )
}

function PriceListRowItem({
  form,
  index,
  code,
  models,
  pendingIds,
  canLink,
  onLink,
  onUnlink,
  onRemove,
}: {
  form: Form
  index: number
  code: string
  models: DeviceModelView[]
  pendingIds: string[]
  canLink: boolean
  onLink: (code: string, modelId: string) => void
  onUnlink: (code: string, modelId: string) => void
  onRemove: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1.5 border-b border-border/50 pb-2 last:border-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <RowInput form={form} index={index} field="customsCode" label={t("customs.customsCode")} placeholder={t("customs.customsCode")} />
        <RowInput form={form} index={index} field="description" label={t("customs.description")} placeholder={t("customs.description")} />
        <RowInput form={form} index={index} field="fee" label={t("customs.fee")} placeholder={t("customs.fee")} type="number" />
        <RowDeleteButton onRemove={onRemove} />
      </div>
      {canLink && code.trim() && (
        <RowModelLinks
          code={code}
          models={models}
          pendingIds={pendingIds}
          onLink={(modelId) => onLink(code, modelId)}
          onUnlink={(modelId) => onUnlink(code, modelId)}
        />
      )}
    </div>
  )
}

function PriceListActions({
  onAppend,
  onFilePicked,
  readingFile,
}: {
  onAppend: () => void
  onFilePicked: (file: File) => void
  readingFile: boolean
}) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFilePicked(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAppend}>
          <Plus className="size-4" />
          {t("customs.addRow")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={readingFile}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          {readingFile ? t("common.loading") : t("customs.fromFile")}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          aria-label={t("customs.fromFile")}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("customs.fileHint")}</p>
    </div>
  )
}

function RowsHeader() {
  const { t } = useI18n()
  return (
    <div className="hidden items-center gap-2 px-2 text-xs font-medium text-muted-foreground sm:flex">
      <span className="flex-1">{t("customs.customsCode")}</span>
      <span className="flex-1">{t("customs.description")}</span>
      <span className="flex-1">{t("customs.fee")}</span>
      <span className="w-9" />
    </div>
  )
}

export function PriceListRowsField({
  form,
  models,
  pending,
  canLink,
  onLink,
  onUnlink,
  onRowsFromFile,
}: PriceListRowsFieldProps) {
  const { t } = useI18n()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" })
  const items = useWatch({ control: form.control, name: "items" }) as
    | CreatePriceListValues["items"]
    | undefined
  const file = usePriceListFile(form, onRowsFromFile)

  return (
    <section className="space-y-2" aria-label={t("customs.rowsTitle")}>
      <h3 className="text-sm font-semibold">{t("customs.rowsTitle")}</h3>
      <RowsHeader />
      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
        {fields.map((field, index) => {
          const code = items?.[index]?.customsCode ?? ""
          return (
            <PriceListRowItem
              key={field.id}
              form={form}
              index={index}
              code={code}
              models={models}
              pendingIds={pending[normalizeCustomsKey(code)] ?? []}
              canLink={canLink}
              onLink={onLink}
              onUnlink={onUnlink}
              onRemove={() => remove(index)}
            />
          )
        })}
      </div>
      <PriceListActions
        onAppend={() => append(emptyRow())}
        onFilePicked={file.handleFilePicked}
        readingFile={file.readingFile}
      />
    </section>
  )
}
