import * as React from "react"
import { useInspections, type InspectionFilters } from "@/entities/qc"

type Setter = (v: string | undefined) => void

export interface InspectionFilterState {
  passed?: string
  setPassed: Setter
  gradeCode?: string
  setGradeCode: Setter
  defectCode?: string
  setDefectCode: Setter
  inspectedById?: string
  setInspectedById: Setter
  from?: string
  setFrom: Setter
  to?: string
  setTo: Setter
}

/** Owns the inspection-history filters + pagination and runs the query. */
export function useInspectionBrowser() {
  const [passed, setPassedRaw] = React.useState<string>()
  const [gradeCode, setGradeCodeRaw] = React.useState<string>()
  const [defectCode, setDefectCodeRaw] = React.useState<string>()
  const [inspectedById, setInspectedByIdRaw] = React.useState<string>()
  const [from, setFromRaw] = React.useState<string>()
  const [to, setToRaw] = React.useState<string>()
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSizeRaw] = React.useState(50)

  const reset = () => setPage(1)
  const bind = (set: (v: string | undefined) => void): Setter => (v) => { set(v); reset() }

  const filters: InspectionFilterState = {
    passed,
    setPassed: bind(setPassedRaw),
    gradeCode,
    setGradeCode: bind(setGradeCodeRaw),
    defectCode,
    setDefectCode: bind(setDefectCodeRaw),
    inspectedById,
    setInspectedById: bind(setInspectedByIdRaw),
    from,
    setFrom: bind(setFromRaw),
    to,
    setTo: bind(setToRaw),
  }

  const setPageSize = (v: number) => { setPageSizeRaw(v); reset() }

  const query = useInspections({
    passed: passed as InspectionFilters["passed"],
    gradeCode,
    defectCode,
    inspectedById,
    from,
    to,
    page,
    pageSize,
  })

  return {
    filters,
    pagination: { page, setPage, pageSize, setPageSize },
    query,
  }
}
