import { http, HttpError } from "@/shared/api/http"
import type { LookupResult, TeachLinkDto } from "../model/lookup.types"

/**
 * Device-code lookup for intake (ADR 0031). GET /lookup?code= resolves a box
 * code or IMEI from the reference lists; 404 (the lists do not know it) maps to
 * null so the caller shows only a quiet hint. The lookup never blocks saving.
 */
export const lookupRepository = {
  find: async (code: string): Promise<LookupResult | null> => {
    try {
      return await http<LookupResult>("/lookup", { params: { code } })
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 404) return null
      throw err
    }
  },

  teachLink: async (dto: TeachLinkDto): Promise<void> => {
    await http("/lookup/links", { method: "POST", body: dto })
  },
}
