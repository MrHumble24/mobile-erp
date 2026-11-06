import * as React from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/shared/ui/dialog"
import type { PriceTagItem } from "../model/price-tag.types"
import { PriceTagSheet } from "./PriceTagSheet"

interface PriceTagsDialogProps {
  items: PriceTagItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function useTagSelection(items: PriceTagItem[]) {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(
    () => new Set(items.map((item) => item.id))
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAll = () => setSelected(new Set(items.map((item) => item.id)))
  const clear = () => setSelected(new Set())

  const selectedItems = items.filter((item) => selected.has(item.id))
  return { selected, selectedItems, toggle, selectAll, clear }
}

function PriceTagPicker({
  items,
  selected,
  onToggle,
}: {
  items: PriceTagItem[]
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
}) {
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#e8e8e8] p-4 text-center text-xs text-muted-foreground">
        {t("inventory.priceTagsEmpty")}
      </div>
    )
  }

  return (
    <div className="max-h-56 divide-y divide-[#e8e8e8] overflow-y-auto rounded-[12px] border border-[#e8e8e8]">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 px-3 py-2">
          <Checkbox checked={selected.has(item.id)} onCheckedChange={() => onToggle(item.id)} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[#202020]">{item.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {item.subtitle ?? item.code ?? ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PriceTagsBody({ items }: { items: PriceTagItem[] }) {
  const { t } = useI18n()
  const { selected, selectedItems, toggle, selectAll, clear } = useTagSelection(items)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={selectAll}>
            {t("inventory.priceTagsSelectAll")}
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            {t("inventory.priceTagsClear")}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("inventory.priceTagsSelected", { count: selectedItems.length })}
        </span>
      </div>

      <PriceTagPicker items={items} selected={selected} onToggle={toggle} />

      <div className="overflow-x-auto rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-2">
        <PriceTagSheet items={selectedItems} />
      </div>

      {/* The printed copy lives on <body>, outside the dialog: inside it the sheet
          would be cut off at the dialog's height on paper. */}
      {createPortal(<PriceTagSheet items={selectedItems} printable />, document.body)}

      <DialogFooter>
        <Button
          className="w-full sm:w-auto"
          disabled={selectedItems.length === 0}
          onClick={() => window.print()}
        >
          {t("inventory.priceTagsPrint")}
        </Button>
      </DialogFooter>
    </div>
  )
}

export function PriceTagsDialog({ items, open, onOpenChange }: PriceTagsDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[92vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.priceTags")}</DialogTitle>
        </DialogHeader>
        {open && <PriceTagsBody items={items} />}
      </DialogPopup>
    </Dialog>
  )
}
