import { useRef, useState } from "react"
import { useFieldArray, type UseFormReturn } from "react-hook-form"
import { Plus, Trash2, Upload } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import { emptyRow, type CreatePriceListValues } from "../model/create-price-list.schema"
import { parseCustomsPriceListFile } from "../model/parse-customs-file"

type Form = UseFormReturn<CreatePriceListValues>

function RowInput({
  form,
  index,
  field,
  placeholder,
  type,
}: {
  form: Form
  index: number
  field: "customsCode" | "description" | "fee"
  placeholder: string
  type?: "number"
}) {
  return (
    <FormField
      control={form.control}
      name={`items.${index}.${field}` as const}
      render={({ field: f }) => (
        <FormItem className="flex-1">
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

function PriceListRowItem({
  form,
  index,
  onRemove,
}: {
  form: Form
  index: number
  onRemove: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-start gap-2">
      <RowInput form={form} index={index} field="customsCode" placeholder={t("customs.customsCode")} />
      <RowInput form={form} index={index} field="description" placeholder={t("customs.description")} />
      <RowInput form={form} index={index} field="fee" placeholder={t("customs.fee")} type="number" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 text-destructive"
        onClick={onRemove}
        aria-label={t("customs.removeRow")}
        title={t("customs.removeRow")}
      >
        <Trash2 className="size-4" />
      </Button>
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
    <div className="flex items-center gap-2">
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
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

export function PriceListRowsField({ form }: { form: Form }) {
  const { t } = useI18n()
  const [readingFile, setReadingFile] = useState(false)
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" })

  const handleFilePicked = async (file: File) => {
    try {
      setReadingFile(true)
      const rows = await parseCustomsPriceListFile(file)
      form.setValue("items", rows, { shouldDirty: true, shouldValidate: true })
      toast.success(t("customs.loadedFromFile", { count: rows.length }))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"))
    } finally {
      setReadingFile(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <span className="flex-1">{t("customs.customsCode")}</span>
        <span className="flex-1">{t("customs.description")}</span>
        <span className="flex-1">{t("customs.fee")}</span>
        <span className="w-9" />
      </div>
      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
        {fields.map((row, index) => (
          <PriceListRowItem key={row.id} form={form} index={index} onRemove={() => remove(index)} />
        ))}
      </div>
      <PriceListActions
        onAppend={() => append(emptyRow())}
        onFilePicked={handleFilePicked}
        readingFile={readingFile}
      />
    </div>
  )
}
