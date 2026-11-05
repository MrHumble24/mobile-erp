import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { useCatalogUnits, type CatalogEntry, type CatalogUnit } from "@/entities/catalog"

export interface CatalogPickHandlers {
  /** Unit ids already in the cart — never offered again. */
  excludeUnitIds: Set<string>
  onPickUnit: (unit: CatalogUnit, entry: CatalogEntry) => void
  onPickQuantity: (entry: CatalogEntry) => void
}

/**
 * Turns a card tap into a cart pick (ADR 0031). A quantity product adds
 * straight away; a unit product fetches its in-stock units and, after dropping
 * the ones already in the cart, adds the only one or opens the picker sheet.
 */
export function useCatalogPick({ excludeUnitIds, onPickUnit, onPickQuantity }: CatalogPickHandlers) {
  const { t } = useI18n()
  const [active, setActive] = React.useState<{ entry: CatalogEntry } | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const { data: units, isFetching } = useCatalogUnits(active?.entry.modelId ?? null)
  const handledRef = React.useRef<object | null>(null)

  const available = React.useMemo(
    () => (units ?? []).filter((u) => !excludeUnitIds.has(u.id)),
    [units, excludeUnitIds]
  )

  React.useEffect(() => {
    if (!active || isFetching || !units || handledRef.current === active) return
    handledRef.current = active
    const free = units.filter((u) => !excludeUnitIds.has(u.id))
    if (free.length === 0) {
      toast.error(t("catalog.noUnits"))
      setActive(null)
    } else if (free.length === 1) {
      onPickUnit(free[0], active.entry)
      setActive(null)
    } else {
      setSheetOpen(true)
    }
  }, [active, units, isFetching, excludeUnitIds, onPickUnit, t])

  const handleTap = (entry: CatalogEntry) => {
    if (entry.kindCode === "QUANTITY") {
      onPickQuantity(entry)
      return
    }
    handledRef.current = null
    setActive({ entry })
  }

  const pickFromSheet = (unit: CatalogUnit) => {
    if (active) onPickUnit(unit, active.entry)
    setSheetOpen(false)
    setActive(null)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setActive(null)
  }

  return {
    handleTap,
    sheetOpen,
    closeSheet,
    pickFromSheet,
    sheetEntry: active?.entry ?? null,
    sheetUnits: available,
  }
}
