import * as React from "react"
import { useDevices } from "@/entities/device"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"

type Setter = (v: string | undefined) => void

export interface QcQueueFilterState {
  searchInput: string
  setSearchInput: (v: string) => void
  statusCode?: string
  setStatusCode: Setter
  modelId?: string
  setModelId: Setter
  storage?: string
  setStorage: Setter
  showInspected: boolean
  setShowInspected: (v: boolean) => void
}

/**
 * Queue = devices awaiting a first QC pass. An uninspected device is always
 * IN_STOCK (defective/sold/consigned all come from an inspected or sold unit),
 * so `inspected=false` alone yields the awaiting queue; the status filter
 * narrows further once inspected rows are shown.
 */
export function useQcQueue() {
  const [searchInput, setSearchInputRaw] = React.useState("")
  const [statusCode, setStatusCodeRaw] = React.useState<string>()
  const [modelId, setModelIdRaw] = React.useState<string>()
  const [storage, setStorageRaw] = React.useState<string>()
  const [showInspected, setShowInspectedRaw] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSizeRaw] = React.useState(50)

  const search = useDebounce(searchInput, 300)
  const reset = () => setPage(1)

  const filters: QcQueueFilterState = {
    searchInput,
    setSearchInput: (v) => { setSearchInputRaw(v); reset() },
    statusCode,
    setStatusCode: (v) => { setStatusCodeRaw(v); reset() },
    modelId,
    setModelId: (v) => { setModelIdRaw(v); reset() },
    storage,
    setStorage: (v) => { setStorageRaw(v); reset() },
    showInspected,
    setShowInspected: (v) => { setShowInspectedRaw(v); reset() },
  }

  const setPageSize = (v: number) => { setPageSizeRaw(v); reset() }

  const query = useDevices({
    inspected: showInspected ? undefined : "false",
    statusCode,
    modelId,
    storage,
    search: search || undefined,
    page,
    pageSize,
  })

  return {
    filters,
    pagination: { page, setPage, pageSize, setPageSize },
    query,
  }
}
