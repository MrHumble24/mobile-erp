import { http } from "@/shared/api/http"
import type { AdjustBonusDto, CustomerBonus } from "../model/bonus.types"

export const bonusRepository = {
  /** A customer's balance + history + the store's live bonus config. */
  get: async (customerId: string): Promise<CustomerBonus> => {
    return http<CustomerBonus>(`/customers/${customerId}/bonus`)
  },

  /** Owner-only manual correction; returns the refreshed view. */
  adjust: async (customerId: string, dto: AdjustBonusDto): Promise<CustomerBonus> => {
    return http<CustomerBonus>(`/customers/${customerId}/bonus/adjustments`, {
      method: "POST",
      body: dto,
    })
  },
}
