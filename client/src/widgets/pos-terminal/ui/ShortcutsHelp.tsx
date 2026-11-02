import { HelpCircle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

const SHORTCUTS: { keys: string; labelKey: string }[] = [
  { keys: "F2", labelKey: "pos.scFocusScanner" },
  { keys: "F9", labelKey: "pos.scCheckout" },
  { keys: "Esc", labelKey: "pos.scClearScanner" },
  { keys: "Ctrl/⌘+⌫", labelKey: "pos.scRemoveLast" },
  { keys: "F4", labelKey: "pos.scToggleCustomer" },
  { keys: "F8", labelKey: "pos.scToggleMode" },
]

export function ShortcutsHelp() {
  const { t } = useI18n()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="ghost" size="icon" aria-label={t("pos.shortcutsTitle")}>
            <HelpCircle className="size-5" />
          </Button>
        }
      />
      <PopoverContent className="w-64">
        <p className="text-sm font-semibold mb-1">{t("pos.shortcutsTitle")}</p>
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between text-xs py-0.5">
            <span className="text-muted-foreground">{t(s.labelKey)}</span>
            <kbd className="rounded bg-[#f0f0f0] px-1.5 py-0.5 font-mono text-[10px]">{s.keys}</kbd>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
