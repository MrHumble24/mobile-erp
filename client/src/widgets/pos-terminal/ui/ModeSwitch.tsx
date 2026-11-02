import { useI18n } from "@/shared/i18n"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import type { PosMode } from "../model/use-pos-terminal"

export interface ModeSwitchProps {
  mode: PosMode
  onModeChange: (mode: PosMode) => void
}

export function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  const { t } = useI18n()
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as PosMode)}>
      <TabsList>
        <TabsTrigger value="sale">{t("pos.modeSale")}</TabsTrigger>
        <TabsTrigger value="nasiya">{t("pos.modeNasiya")}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
