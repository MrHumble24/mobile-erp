import * as React from "react"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { useI18n } from "@/shared/i18n"

export const QC_SCANNER_ID = "qc-scanner-input"

/** Scans any IMEI and hands it to the page, which opens the inspection dialog. */
export function QcScanner({ onScan }: { onScan: (imei: string) => void }) {
  const { t } = useI18n()
  const [value, setValue] = React.useState("")
  return (
    <div className="w-full max-w-xl">
      <BarcodeInput
        id={QC_SCANNER_ID}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue("")}
        onScan={(imei) => { onScan(imei); setValue("") }}
        placeholder={t("catalog.scanCode")}
      />
    </div>
  )
}
