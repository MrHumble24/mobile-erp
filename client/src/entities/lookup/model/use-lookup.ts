import { useQuery } from "@tanstack/react-query"
import { lookupRepository } from "../api/lookup.repository"
import { lookupKeys } from "../api/lookup.keys"

/** Shortest code worth looking up: an Apple box code's 5-char base. */
export const MIN_LOOKUP_LENGTH = 5

/**
 * Resolves a box code / IMEI to a reference + maybe our product. The reference
 * lists are static, so the answer is cached for the session. Never retries;
 * a 404 resolves to null (the caller shows a quiet hint).
 */
export function useLookup(code: string | null) {
  const trimmed = code?.trim() ?? ""
  return useQuery({
    queryKey: lookupKeys.find(trimmed),
    queryFn: () => lookupRepository.find(trimmed),
    enabled: trimmed.length >= MIN_LOOKUP_LENGTH,
    staleTime: Infinity,
    retry: false,
  })
}
