import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { todayIso } from "@/shared/lib/local-date"
import type { HttpError } from "@/shared/api/http"
import { toast } from "@/shared/ui/sonner"
import type {
  ImportShipmentProblem,
  ImportShipmentRow,
  ImportShipmentWarning,
} from "./import-shipment.types"
import { parseBatchFile } from "./parse-batch-file"
import { useImportShipment } from "./use-import-shipment"
import type { ImportShipmentMetaValues } from "../ui/ImportShipmentMetaFields"

function toProblemMap(problems: ImportShipmentProblem[]): Map<number, ImportShipmentProblem[]> {
  const map = new Map<number, ImportShipmentProblem[]>()
  for (const p of problems) {
    const list = map.get(p.row) ?? []
    list.push(p)
    map.set(p.row, list)
  }
  return map
}

function toWarningMap(warnings: ImportShipmentWarning[]): Map<number, ImportShipmentWarning[]> {
  const map = new Map<number, ImportShipmentWarning[]>()
  for (const w of warnings) {
    const list = map.get(w.row) ?? []
    list.push(w)
    map.set(w.row, list)
  }
  return map
}

function useBatchFileReader() {
  const { t } = useI18n()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [readingFile, setReadingFile] = React.useState(false)
  const [rows, setRows] = React.useState<ImportShipmentRow[]>([])

  const readFile = async (file: File, onSuccess: (rows: ImportShipmentRow[]) => void) => {
    try {
      setReadingFile(true)
      const parsedRows = await parseBatchFile(file)
      setRows(parsedRows)
      setFileName(file.name)
      onSuccess(parsedRows)
      toast.success(t("shipments.sheetLoaded", { count: parsedRows.length }))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"))
    } finally {
      setReadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return { fileInputRef, fileName, readingFile, rows, readFile }
}

function useBatchMetaState() {
  const [meta, setMeta] = React.useState<ImportShipmentMetaValues>({
    supplierId: "",
    storeId: "",
    paymentAccountCode: "CASH",
    shipmentDate: todayIso(),
    exchangeRate: "1.3",
    notes: "",
  })
  const handleMetaChange = React.useCallback(
    <K extends keyof ImportShipmentMetaValues>(key: K, value: ImportShipmentMetaValues[K]) => {
      setMeta((prev) => ({ ...prev, [key]: value }))
    },
    []
  )
  return { meta, handleMetaChange }
}

function validateMeta(meta: ImportShipmentMetaValues, count: number, t: (k: string) => string): number | null {
  if (count === 0) { toast.error(t("shipments.noRowsToImport")); return null }
  if (!meta.supplierId) { toast.error(t("shipments.selectSupplier")); return null }
  if (!meta.storeId) { toast.error(t("shipments.selectStore")); return null }
  const rate = Number(meta.exchangeRate)
  if (!Number.isFinite(rate) || rate <= 0) { toast.error(t("shipments.invalidRate")); return null }
  return rate
}

function useImportSubmit(
  meta: ImportShipmentMetaValues,
  rows: ImportShipmentRow[],
  onSuccess: (id: string) => void,
  closeDialog: () => void,
  setProblems: (p: ImportShipmentProblem[]) => void
) {
  const { t } = useI18n()
  const importMutation = useImportShipment()

  const handleSubmit = () => {
    const rate = validateMeta(meta, rows.length, t)
    if (rate == null) return

    importMutation.mutate(
      {
        supplierId: meta.supplierId,
        storeId: meta.storeId,
        paymentAccountCode: meta.paymentAccountCode,
        shipmentDate: meta.shipmentDate,
        exchangeRate: rate,
        notes: meta.notes.trim() || undefined,
        rows,
      },
      {
        onSuccess: (result) => {
          toast.success(t("shipments.importSuccess"))
          closeDialog()
          onSuccess(result.id)
        },
        onError: (err: HttpError) => {
          const body = err.data as { problems?: ImportShipmentProblem[] } | undefined
          if (Array.isArray(body?.problems) && body.problems.length > 0) {
            setProblems(body.problems)
            toast.error(t("shipments.importValidationFailed", { count: body.problems.length }))
          } else {
            toast.error(err.message || t("common.error"))
          }
        },
      }
    )
  }

  return { handleSubmit, isSubmitting: importMutation.isPending }
}

export function useImportDialogState(onSuccess: (id: string) => void, closeDialog: () => void) {
  const { fileInputRef, fileName, readingFile, rows, readFile } = useBatchFileReader()
  const { meta, handleMetaChange } = useBatchMetaState()
  const [problems, setProblems] = React.useState<ImportShipmentProblem[]>([])
  const [warnings, setWarnings] = React.useState<ImportShipmentWarning[]>([])
  const { handleSubmit, isSubmitting } = useImportSubmit(meta, rows, onSuccess, closeDialog, setProblems)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file, () => { setProblems([]); setWarnings([]) })
  }

  return {
    fileInputRef,
    fileName,
    readingFile,
    rows,
    meta,
    problemsMap: React.useMemo(() => toProblemMap(problems), [problems]),
    warningsMap: React.useMemo(() => toWarningMap(warnings), [warnings]),
    isSubmitting,
    handleMetaChange,
    handleFileChange,
    handleSubmit,
  }
}
