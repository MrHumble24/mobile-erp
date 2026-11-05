import { ScanLine, LayoutGrid } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import type { InputMode } from "../model/pos-prefs.store"

export interface InputModeSwitchProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
}

/** Scan ⇄ Catalog toggle. Both modes feed the same cart (ADR 0031). */
export function InputModeSwitch({ mode, onModeChange }: InputModeSwitchProps) {
  const { t } = useI18n()
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as InputMode)}>
      <TabsList>
        <TabsTrigger value="scan" className="gap-1.5">
          <ScanLine className="size-4" />
          {t("catalog.scanMode")}
        </TabsTrigger>
        <TabsTrigger value="catalog" className="gap-1.5">
          <LayoutGrid className="size-4" />
          {t("catalog.catalogMode")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
