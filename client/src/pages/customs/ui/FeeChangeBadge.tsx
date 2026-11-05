import { ArrowDown, ArrowUp, Minus, Sparkles } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Badge } from "@/shared/ui/badge"
import type { FeeChange } from "@/entities/customs"

const MAP: Record<FeeChange, { key: string; variant: "mint" | "violet" | "outline"; Icon: typeof ArrowUp }> = {
  up: { key: "customs.wentUp", variant: "violet", Icon: ArrowUp },
  down: { key: "customs.wentDown", variant: "mint", Icon: ArrowDown },
  same: { key: "customs.unchanged", variant: "outline", Icon: Minus },
  new: { key: "customs.newItem", variant: "mint", Icon: Sparkles },
}

export function FeeChangeBadge({ change }: { change: FeeChange }) {
  const { t } = useI18n()
  const { key, variant, Icon } = MAP[change]
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="size-3" />
      {t(key)}
    </Badge>
  )
}
