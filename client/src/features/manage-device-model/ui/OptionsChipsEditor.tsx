import * as React from "react"
import { X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function splitInput(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function Chips({ value, onRemove }: { value: string[]; onRemove: (opt: string) => void }) {
  const { t } = useI18n()
  if (value.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((opt) => (
        <Badge key={opt} variant="outline" size="sm" className="gap-1">
          {opt}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(opt)}
            className="size-4 rounded-sm text-muted-foreground hover:text-destructive"
            aria-label={t("common.delete")}
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}

/** Chip list editor for a select attribute's options. Enter / comma-paste adds. */
export function OptionsChipsEditor({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = React.useState("")

  const addMany = (candidates: string[]) => {
    const merged = [...value]
    for (const c of candidates) {
      if (c && !merged.includes(c)) merged.push(c)
    }
    if (merged.length !== value.length) onChange(merged)
  }

  const commitDraft = () => {
    addMany(splitInput(draft))
    setDraft("")
  }

  const remove = (opt: string) => onChange(value.filter((o) => o !== opt))

  return (
    <div className="space-y-2">
      <Chips value={value} onRemove={remove} />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commitDraft()
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text")
          if (text.includes(",")) {
            e.preventDefault()
            addMany(splitInput(text))
          }
        }}
        onBlur={commitDraft}
        placeholder={t("inventory.attrOptionsPlaceholder")}
        className="h-9"
      />
    </div>
  )
}
