import * as React from "react"
import type { ShipmentView } from "@/entities/shipment"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"

export interface ShipmentFilterState {
  supplierId?: string
  setSupplierId: (v: string | undefined) => void
  openOnly: boolean
  setOpenOnly: (v: boolean) => void
  searchInput: string
  setSearchInput: (v: string) => void
}

function matchesSearch(
  shipment: ShipmentView,
  suppliersMap: Record<string, string>,
  query: string
): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const name = (suppliersMap[shipment.supplierId] || "").toLowerCase()
  return name.includes(q) || (shipment.notes || "").toLowerCase().includes(q)
}

/** Client-side filter + newest-first sort over the loaded shipments list. */
export function useShipmentBrowser(shipments: ShipmentView[], suppliersMap: Record<string, string>) {
  const [supplierId, setSupplierId] = React.useState<string>()
  const [openOnly, setOpenOnly] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState("")
  const search = useDebounce(searchInput, 300)

  const filtered = React.useMemo(() => {
    return shipments
      .filter((s) => !supplierId || s.supplierId === supplierId)
      .filter((s) => !openOnly || s.deviceCount < s.expectedCount)
      .filter((s) => matchesSearch(s, suppliersMap, search))
      .slice()
      .sort((a, b) => new Date(b.shipmentDate).getTime() - new Date(a.shipmentDate).getTime())
  }, [shipments, suppliersMap, supplierId, openOnly, search])

  const filters: ShipmentFilterState = {
    supplierId,
    setSupplierId,
    openOnly,
    setOpenOnly,
    searchInput,
    setSearchInput,
  }

  return { filters, filtered }
}
