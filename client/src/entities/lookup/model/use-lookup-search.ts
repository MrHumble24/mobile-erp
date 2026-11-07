import { useQuery } from "@tanstack/react-query"
import { lookupRepository } from "../api/lookup.repository"
import { lookupKeys } from "../api/lookup.keys"

/** Minimum query length to trigger search. */
export const MIN_SEARCH_LENGTH = 2

/**
 * Searches the reference lists by model name, series, or maker code.
 * Fast in-memory / indexed search across Apple and Samsung reference catalogs.
 */
export function useLookupSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: lookupKeys.search(trimmed),
    queryFn: () => lookupRepository.search(trimmed),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    staleTime: 5 * 60 * 1000,
  })
}

