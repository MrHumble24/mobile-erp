import { Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

export interface DraftTransferLine {
  lineType: "UNIT" | "QUANTITY"
  deviceId?: string
  modelId?: string
  quantity?: number
  label: string
  identifier?: string
  availableStock?: number
}

interface TransferLinesEditorProps {
  lines: DraftTransferLine[]
  onUpdateQty: (idx: number, qty: number) => void
  onRemoveLine: (idx: number) => void
}

export function TransferLinesEditor({
  lines,
  onUpdateQty,
  onRemoveLine,
}: TransferLinesEditorProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">
        {t("transfers.lines")} ({lines.length})
      </Label>
      {lines.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          {t("transfers.noLinesAdded")}
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-[10px] p-2 bg-card">
          {lines.map((line, idx) => (
            <div
              key={line.deviceId || line.modelId || idx}
              className="flex items-center justify-between p-2 rounded-[8px] hover:bg-muted text-xs"
            >
              <div className="flex flex-col">
                <span className="font-medium">{line.label}</span>
                {line.identifier && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {line.identifier}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {line.lineType === "QUANTITY" ? (
                  <Input
                    type="number"
                    min="1"
                    className="w-16 h-7 text-xs"
                    value={line.quantity ?? 1}
                    onChange={(e) =>
                      onUpdateQty(idx, parseInt(e.target.value, 10) || 1)
                    }
                  />
                ) : (
                  <span className="text-[11px] text-muted-foreground">1</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveLine(idx)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
