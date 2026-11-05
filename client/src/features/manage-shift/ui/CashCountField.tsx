import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

/** The drawer cash-count number input shared by the open / close / force-close forms. */
export function CashCountField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step="0.01"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 text-base font-bold"
      />
    </div>
  )
}
