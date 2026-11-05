import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { ScanResultCard } from "./ScanResultCard"
import { SCANNER_INPUT_ID, type PosScannerApi } from "../model/use-pos-scanner"

export interface PosScannerProps {
  scanner: PosScannerApi
}

export function PosScanner({ scanner }: PosScannerProps) {
  const { t } = useI18n()

  const handleScan = (code: string) => {
    if (!scanner.submit(code)) toast.error(t("pos.invalidImei"))
  }

  return (
    <div className="space-y-3">
      <BarcodeInput
        id={SCANNER_INPUT_ID}
        autoFocus
        value={scanner.imei}
        onChange={(e) => scanner.setImei(e.target.value)}
        onScan={handleScan}
        onClear={scanner.clear}
        placeholder={t("catalog.scanCode")}
        className="h-12 text-base"
      />
      {scanner.scanResult && <ScanResultCard result={scanner.scanResult} />}
    </div>
  )
}
