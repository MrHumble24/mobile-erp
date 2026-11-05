import { http } from "@/shared/api/http"
import type {
  CreatePriceListDto,
  CurrentPriceList,
  FeeHistoryPoint,
  PriceListSummary,
  UnmatchedModel,
} from "../model/customs.types"

export const customsRepository = {
  current: async (): Promise<CurrentPriceList | null> => {
    return http<CurrentPriceList | null>("/customs/price-lists/current")
  },

  versions: async (): Promise<PriceListSummary[]> => {
    return http<PriceListSummary[]>("/customs/price-lists")
  },

  unmatchedModels: async (): Promise<UnmatchedModel[]> => {
    return http<UnmatchedModel[]>("/customs/price-lists/unmatched-models")
  },

  feeHistory: async (customsCode: string): Promise<FeeHistoryPoint[]> => {
    return http<FeeHistoryPoint[]>(
      `/customs/price-lists/fees/${encodeURIComponent(customsCode)}/history`
    )
  },

  createPriceList: async (dto: CreatePriceListDto): Promise<PriceListSummary> => {
    return http<PriceListSummary>("/customs/price-lists", {
      method: "POST",
      body: dto,
    })
  },
}
