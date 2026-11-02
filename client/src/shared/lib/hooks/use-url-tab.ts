import * as React from "react"
import { useSearchParams } from "react-router"

export interface UseUrlTabOptions<T extends string> {
  paramKey?: string
  validTabs?: readonly T[]
}

/**
 * Synchronizes tab selection with a URL search parameter.
 * - Reads `?<paramKey>=<value>` (defaults to `tab`)
 * - Updates URL using `{ replace: true }`
 * - Removes param when active tab is default to keep URLs clean
 */
export function useUrlTab<T extends string>(
  defaultTab: T,
  options?: UseUrlTabOptions<T>
): [T, (nextTab: T) => void] {
  const paramKey = options?.paramKey ?? "tab"
  const validTabs = options?.validTabs
  const [searchParams, setSearchParams] = useSearchParams()

  const rawValue = searchParams.get(paramKey) as T | null

  const activeTab = React.useMemo(() => {
    if (!rawValue) return defaultTab
    if (validTabs && !validTabs.includes(rawValue)) return defaultTab
    return rawValue
  }, [rawValue, validTabs, defaultTab])

  const setTab = React.useCallback(
    (nextTab: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (nextTab === defaultTab) {
            next.delete(paramKey)
          } else {
            next.set(paramKey, nextTab)
          }
          return next
        },
        { replace: true }
      )
    },
    [defaultTab, paramKey, setSearchParams]
  )

  return [activeTab, setTab]
}

