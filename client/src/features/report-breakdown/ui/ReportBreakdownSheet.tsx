import { useI18n } from "@/shared/i18n"
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet"
import { BREAKDOWN_REGISTRY } from "../model/registry"
import type { BreakdownRequest } from "../model/breakdown.types"

export interface ReportBreakdownSheetProps {
  request: BreakdownRequest | null
  onOpenChange: (open: boolean) => void
  onOpen: (req: BreakdownRequest) => void
  onNavigate: (path: string) => void
  canViewCost: boolean
}

function subtitleOf(request: BreakdownRequest): string | undefined {
  if ("label" in request) return request.label
  if (request.kind === "partner") return request.shopName
  return undefined
}

export function ReportBreakdownSheet({
  request,
  onOpenChange,
  onOpen,
  onNavigate,
  canViewCost,
}: ReportBreakdownSheetProps) {
  const { t } = useI18n()
  if (!request) return null
  const entry = BREAKDOWN_REGISTRY[request.kind]
  const { Component } = entry
  const subtitle = subtitleOf(request)

  return (
    <Sheet open={Boolean(request)} onOpenChange={onOpenChange}>
      <SheetPopup className="w-full sm:max-w-3xl lg:max-w-5xl">
        <SheetHeader>
          <SheetTitle>{t(entry.titleKey)}</SheetTitle>
          <SheetDescription>{subtitle ?? t("reports.breakdownHint")}</SheetDescription>
        </SheetHeader>
        <div className="pt-4">
          <Component
            request={request}
            onOpen={onOpen}
            onNavigate={onNavigate}
            canViewCost={canViewCost}
          />
        </div>
      </SheetPopup>
    </Sheet>
  )
}
