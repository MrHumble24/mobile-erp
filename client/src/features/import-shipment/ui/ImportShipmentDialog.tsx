import type * as React from "react"
import { FileSpreadsheet, Upload } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  Dialog,
  DialogPopup,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useImportDialogState } from "../model/use-import-dialog-state"
import { ImportShipmentMetaFields } from "./ImportShipmentMetaFields"
import { ImportShipmentPreviewTable } from "./ImportShipmentPreviewTable"

export interface ImportShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (shipmentId: string) => void
}

function FilePickerRow({
  fileName,
  rowCount,
  reading,
  onPick,
  inputRef,
  onChange,
}: {
  fileName: string | null
  rowCount: number
  reading: boolean
  onPick: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={reading}
        className="gap-2"
        onClick={onPick}
      >
        <Upload className="size-4" />
        {reading ? t("common.loading") : t("shipments.chooseBatchFile")}
      </Button>
      {fileName && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <FileSpreadsheet className="size-4 text-emerald-600" />
          {fileName} ({rowCount})
        </span>
      )}
      <Input
        ref={inputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}

function DialogActions({
  onCancel,
  onSubmit,
  disabled,
  submitting,
  rowCount,
}: {
  onCancel: () => void
  onSubmit: () => void
  disabled: boolean
  submitting: boolean
  rowCount: number
}) {
  const { t } = useI18n()
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        {t("common.cancel")}
      </Button>
      <Button type="button" disabled={disabled} onClick={onSubmit}>
        {submitting ? t("common.loading") : t("shipments.submitImport", { count: rowCount })}
      </Button>
    </DialogFooter>
  )
}

export function ImportShipmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportShipmentDialogProps) {
  const { t } = useI18n()
  const state = useImportDialogState(onSuccess, () => onOpenChange(false))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("shipments.importFromFile")}</DialogTitle>
          <DialogDescription>
            {t("shipments.importFromFileDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FilePickerRow
            fileName={state.fileName}
            rowCount={state.rows.length}
            reading={state.readingFile}
            onPick={() => state.fileInputRef.current?.click()}
            inputRef={state.fileInputRef}
            onChange={state.handleFileChange}
          />

          <ImportShipmentMetaFields
            values={state.meta}
            onChange={state.handleMetaChange}
          />

          {state.rows.length > 0 && (
            <ImportShipmentPreviewTable
              rows={state.rows}
              exchangeRate={Number(state.meta.exchangeRate) || 0}
              problemsMap={state.problemsMap}
              warningsMap={state.warningsMap}
            />
          )}
        </div>

        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={state.handleSubmit}
          disabled={state.rows.length === 0 || state.isSubmitting}
          submitting={state.isSubmitting}
          rowCount={state.rows.length}
        />
      </DialogPopup>
    </Dialog>
  )
}
