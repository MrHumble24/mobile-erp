import * as React from "react"
import { useDevices } from "@/entities/device"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"

type Setter = (v: string | undefined) => void

export interface InventoryFilterState {
  searchInput: string
  setSearchInput: (v: string) => void
  modelId?: string
  setModelId: Setter
  statusCode?: string
  setStatusCode: Setter
  storage?: string
  setStorage: Setter
}

/** Owns the inventory list filters + pagination and runs the devices query. */
export function useDeviceBrowser() {
  const [searchInput, setSearchInputRaw] = React.useState("")
  const [modelId, setModelIdRaw] = React.useState<string>()
  const [statusCode, setStatusCodeRaw] = React.useState<string>()
  const [storage, setStorageRaw] = React.useState<string>()
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSizeRaw] = React.useState(50)

  const search = useDebounce(searchInput, 300)

  // Any filter or page-size change returns to the first page.
  const filters: InventoryFilterState = {
    searchInput,
    setSearchInput: (v) => { setSearchInputRaw(v); setPage(1) },
    modelId,
    setModelId: (v) => { setModelIdRaw(v); setPage(1) },
    statusCode,
    setStatusCode: (v) => { setStatusCodeRaw(v); setPage(1) },
    storage,
    setStorage: (v) => { setStorageRaw(v); setPage(1) },
  }

  const setPageSize = (v: number) => { setPageSizeRaw(v); setPage(1) }

  const query = useDevices({
    search: search || undefined,
    modelId,
    statusCode,
    storage,
    page,
    pageSize,
  })

  return {
    filters,
    pagination: { page, setPage, pageSize, setPageSize },
    query,
  }
}
