import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HttpError, httpErrorCode, isNetworkError } from "@/shared/api/http"
import { isOnline } from "@/shared/lib/offline"
import { saleRepository, saleKeys, type SaleTradeInDto } from "@/entities/sale"
import { deviceKeys } from "@/entities/device"
import { stockKeys } from "@/entities/stock"
import { catalogKeys } from "@/entities/catalog"
import { customerKeys } from "@/entities/customer"
import { customerPurchaseKeys } from "@/entities/customer-purchase"
import { ledgerKeys } from "@/entities/ledger"
import { bonusKeys, type CustomerBonus } from "@/entities/bonus"
import { enqueueMutation, MUTATION_TYPES } from "@/entities/sync"
import { useCartStore } from "./cart.store"
import { useTradeInStore, type TradeInDraft } from "./trade-in.store"
import { useBonusRedeemStore } from "./bonus-redeem.store"
import { buildCartTenderPlan } from "./use-tender-plan"
import { toSaleDto } from "../lib/to-sale-dto"
import { buildCartPayments } from "../lib/payment"
import { cartLineLabel } from "../lib/cart-line-label"

export interface CheckoutResult {
  /** Sales confirmed by the server now. */
  saleIds: string[]
  /** Lines queued offline; will sync when the connection returns. */
  queuedCount: number
}

/** A line failed mid-checkout; carries the already-succeeded sale ids so the caller can still print them. */
export class CheckoutLineError extends Error {
  /** The failing line's label: a unit code or a product name. */
  imei: string
  statusCode?: number
  /** The server's error code (e.g. `NO_OPEN_SHIFT`), when the body carried one. */
  code?: string
  saleIds: string[]

  constructor(imei: string, saleIds: string[], cause: unknown) {
    const http = cause instanceof HttpError ? cause : undefined
    super(http?.message || (cause instanceof Error ? cause.message : "checkout failed"))
    this.name = "CheckoutLineError"
    this.imei = imei
    this.statusCode = http?.statusCode
    this.code = httpErrorCode(http)
    this.saleIds = saleIds
  }
}

function toTradeInDtos(drafts: TradeInDraft[]): SaleTradeInDto[] {
  return drafts.map((d) => ({
    modelId: d.modelId,
    imei: d.imei,
    imei2: d.imei2,
    serialNumber: d.serialNumber,
    specs: d.specs,
    value: d.value,
  }))
}

/**
 * Submits cart lines sequentially, one POST /sales each. Succeeded lines are removed
 * from the cart as they complete (so a retry is idempotent on the remaining lines);
 * the first failure stops the loop and surfaces which IMEI failed and why.
 *
 * Trade-ins (ADR 0039) are allocated to the lines that can carry them; each line's
 * payments are sent as its price − the trade-ins put on it, and those trade-ins ride
 * that line's POST. Bonus points (ADR 0043) ride on top, one `bonusRedeem` per line;
 * the same online-only rule applies. A trade-in's draft is dropped as its line
 * commits, so a retry never sends it twice. Online only — a cart with trade-ins or
 * spent points is never queued.
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
      const level = snapshot.priceLevelCode
      const tradeIns = useTradeInStore.getState().tradeIns
      const hasTradeIns = tradeIns.length > 0
      const customerId = snapshot.customer?.id
      const bonus = customerId
        ? queryClient.getQueryData<CustomerBonus>(bonusKeys.detail(customerId))
        : undefined
      const plan = buildCartTenderPlan(lines, level, tradeIns, {
        requested: useBonusRedeemStore.getState().requested,
        balance: Number(bonus?.balance ?? 0),
        maxPercent: Number(bonus?.maxRedeemPercent ?? 0),
        allowed: Boolean(customerId) && Boolean(bonus?.enabled) && isOnline(),
      })
      const hasPoints = plan.redeem.total > 0
      const payments = buildCartPayments(plan.payableLines, snapshot.paymentMethod, snapshot.splitParts)
      const draftById = new Map(tradeIns.map((t) => [t.id, t]))

      for (const line of lines) {
        const customer = useCartStore.getState().customer
        const linePayments = payments[line.lineId]?.filter((p) => p.amount > 0)
        const dto = toSaleDto(line, customer, level, linePayments?.length ? linePayments : undefined)
        const linePoints = plan.redeem.byLine[line.lineId] ?? 0
        if (linePoints > 0) dto.bonusRedeem = linePoints
        const lineTradeInIds = plan.tradeIn.itemsByLine[line.lineId] ?? []
        if (lineTradeInIds.length > 0) {
          dto.tradeIns = toTradeInDtos(
            lineTradeInIds.map((id) => draftById.get(id)).filter((d): d is TradeInDraft => Boolean(d))
          )
        }
        try {
          const sale = await saleRepository.create(dto)
          saleIds.push(sale.id)
          useCartStore.getState().removeLine(line.lineId)
          // Keep a retry after a later failure from spending these points twice.
          if (linePoints > 0) {
            const redeem = useBonusRedeemStore.getState()
            redeem.setRequested(Math.max(0, redeem.requested - linePoints))
          }
          if (lineTradeInIds.length > 0) useTradeInStore.getState().removeMany(lineTradeInIds)
        } catch (err) {
          // A trade-in or spent points are never queued for sync (the server
          // refuses them on replay, ADR 0039/0043): surface the failure instead.
          if (isNetworkError(err) && !hasTradeIns && !hasPoints) {
            await enqueueMutation({
              id: line.clientMutationId,
              type: MUTATION_TYPES.saleCreate,
              payload: dto as unknown as Record<string, unknown>,
              baseVersion: line.kind === "unit" ? line.device.version : undefined,
              occurredAt: new Date().toISOString(),
            })
            queuedCount += 1
            useCartStore.getState().removeLine(line.lineId)
            continue
          }
          throw new CheckoutLineError(cartLineLabel(line), saleIds, err)
        }
      }
      return { saleIds, queuedCount }
    },
    onSuccess: () => {
      useBonusRedeemStore.getState().reset()
      queryClient.invalidateQueries({ queryKey: bonusKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.lookups() })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() })
      queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerPurchaseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all })
    },
  })
}
