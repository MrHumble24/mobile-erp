import { useQueries } from "@tanstack/react-query"
import { saleRepository } from "../api/sale.repository"
import { saleKeys } from "../api/sale.keys"
import { combineReceipts } from "../lib/combine-receipts"
import type { ReceiptView } from "./sale.types"

/** Fetches every sale's receipt and folds them into one combined receipt. */
export function useSaleReceipts(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: saleKeys.receipt(id),
      queryFn: () => saleRepository.getReceipt(id),
      enabled: Boolean(id),
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const receipts = results
    .map((r) => r.data)
    .filter((d): d is ReceiptView => Boolean(d))

  return {
    isLoading,
    receipt: isLoading ? null : combineReceipts(receipts),
  }
}
