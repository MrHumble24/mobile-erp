import { useState } from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { CustomsFileError, parseCustomsPriceListFile } from "./parse-customs-file"
import type { CreatePriceListValues, PriceListRow } from "./create-price-list.schema"
import type { UseFormReturn } from "react-hook-form"

/**
 * Opening the customs price-list Excel file ("Модель" / "Цена расстаможки"
 * headers), replacing the form rows with what it contains and letting the
 * caller auto-link the new codes to device models.
 */
export function usePriceListFile(
  form: UseFormReturn<CreatePriceListValues>,
  onRowsFromFile: (rows: PriceListRow[]) => void
) {
  const { t } = useI18n()
  const [readingFile, setReadingFile] = useState(false)

  const handleFilePicked = async (file: File) => {
    try {
      setReadingFile(true)
      const rows = await parseCustomsPriceListFile(file)
      form.setValue("items", rows, { shouldDirty: true, shouldValidate: true })
      onRowsFromFile(rows)
      toast.success(t("customs.loadedFromFile", { count: rows.length }))
    } catch (err: unknown) {
      const code = err instanceof CustomsFileError ? err.code : null
      const message =
        code === "bad-format"
          ? t("customs.badFile")
          : code === "empty"
            ? t("customs.fileEmpty")
            : t("customs.fileReadError")
      toast.error(message)
    } finally {
      setReadingFile(false)
    }
  }

  return { readingFile, handleFilePicked }
}
