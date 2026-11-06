import * as React from "react"
import { Tag } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { usePrintSettings } from "@/entities/settings"
import { Button } from "@/shared/ui/button"
import type { PriceTagItem } from "../model/price-tag.types"
import { PriceTagsDialog } from "./PriceTagsDialog"

/** The "Price tags" button + dialog, rendered only while the setting is on. */
export function PriceTagsAction({ items }: { items: PriceTagItem[] }) {
  const { t } = useI18n()
  const { priceTagsEnabled } = usePrintSettings()
  const [open, setOpen] = React.useState(false)

  if (!priceTagsEnabled) return null

  return (
    <>
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <Tag className="size-3.5" />
        {t("inventory.priceTags")}
      </Button>
      <PriceTagsDialog items={items} open={open} onOpenChange={setOpen} />
    </>
  )
}
