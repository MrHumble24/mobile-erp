import { createContext, useContext, type ReactNode } from "react"

const ReportAllStoresContext = createContext<boolean>(false)

export function ReportAllStoresProvider({
  allStores,
  children,
}: {
  allStores: boolean
  children: ReactNode
}) {
  return (
    <ReportAllStoresContext.Provider value={allStores}>
      {children}
    </ReportAllStoresContext.Provider>
  )
}

export function useReportAllStores(): boolean {
  return useContext(ReportAllStoresContext)
}
