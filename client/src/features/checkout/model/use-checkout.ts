import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HttpError } from "@/shared/api/http"
import { saleRepository, saleKeys } from "@/entities/sale"
import { deviceKeys } from "@/entities/device"
import { customerKeys } from "@/entities/customer"
import { useCartStore } from "./cart.store"
import { toSaleDto } from "../lib/to-sale-dto"

export interface CheckoutResult {
  saleIds: string[]
}

/** A line failed mid-checkout; carries the already-succeeded sale ids so the caller can still print them. */
export class CheckoutLineError extends Error {
  imei: string
  statusCode?: number
  saleIds: string[]

  constructor(imei: string, saleIds: string[], cause: unknown) {
    const http = cause instanceof HttpError ? cause : undefined
    super(http?.message || (cause instanceof Error ? cause.message : "checkout failed"))
    this.name = "CheckoutLineError"
    this.imei = imei
    this.statusCode = http?.statusCode
    this.saleIds = saleIds
  }
}

/**
 * Submits cart lines sequentially, one POST /sales each. Succeeded lines are removed
 * from the cart as they complete (so a retry is idempotent on the remaining lines);
 * the first failure stops the loop and surfaces which IMEI failed and why.
 */
export function useCheckout() {
  const queryClient = useQueryClient()

  return useMutation<CheckoutResult, CheckoutLineError>({
    mutationFn: async () => {
      const saleIds: string[] = []
      // Snapshot now; removeLine mutates the store as we go.
      const lines = [...useCartStore.getState().lines]
      for (const line of lines) {
        const customer = useCartStore.getState().customer
        try {
          const sale = await saleRepository.create(toSaleDto(line, customer))
          saleIds.push(sale.id)
          useCartStore.getState().removeLine(line.lineId)
        } catch (err) {
          throw new CheckoutLineError(line.device.imei, saleIds, err)
        }
      }
      return { saleIds }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
