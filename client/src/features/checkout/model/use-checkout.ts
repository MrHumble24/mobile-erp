import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HttpError, isNetworkError } from "@/shared/api/http"
import { saleRepository, saleKeys } from "@/entities/sale"
import { deviceKeys } from "@/entities/device"
import { customerKeys } from "@/entities/customer"
import { enqueueMutation, MUTATION_TYPES } from "@/entities/sync"
import { useCartStore } from "./cart.store"
import { toSaleDto } from "../lib/to-sale-dto"
import { effectiveMethod, linePayments } from "../lib/payment"

export interface CheckoutResult {
  /** Sales confirmed by the server now. */
  saleIds: string[]
  /** Lines queued offline; will sync when the connection returns. */
  queuedCount: number
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
      let queuedCount = 0
      // Snapshot now; removeLine mutates the store as we go.
      const snapshot = useCartStore.getState()
      const lines = [...snapshot.lines]
      const method = effectiveMethod(snapshot.paymentMethod, lines)
      const splitParts = snapshot.splitParts
      for (const line of lines) {
        const customer = useCartStore.getState().customer
        const dto = toSaleDto(line, customer, linePayments(line, method, splitParts))
        try {
          const sale = await saleRepository.create(dto)
          saleIds.push(sale.id)
          useCartStore.getState().removeLine(line.lineId)
        } catch (err) {
          // Transport failure → queue the same payload (same clientMutationId)
          // and clear the line as if it succeeded. HTTP verdicts still stop here.
          if (isNetworkError(err)) {
            await enqueueMutation({
              id: line.clientMutationId,
              type: MUTATION_TYPES.saleCreate,
              payload: dto as unknown as Record<string, unknown>,
              baseVersion: line.device.version,
              occurredAt: new Date().toISOString(),
            })
            queuedCount += 1
            useCartStore.getState().removeLine(line.lineId)
            continue
          }
          throw new CheckoutLineError(line.device.imei, saleIds, err)
        }
      }
      return { saleIds, queuedCount }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
