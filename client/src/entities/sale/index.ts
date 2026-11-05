export type {
  SaleView,
  SaleModelRef,
  TradeInView,
  SaleTradeInDto,
  SalePaymentLine,
  SaleReturnRef,
  SaleStats,
  ReceiptView,
  ReceiptItem,
  WarrantyLookupView,
  CreateSaleDto,
  ReturnSaleDto,
  SaleFilters,
  SalePage,
} from "./model/sale.types"
export { saleRepository } from "./api/sale.repository"
export { saleKeys } from "./api/sale.keys"
export {
  useSales,
  useSalesStats,
  useSale,
  useSaleReceipt,
  useWarrantyLookup,
  useCreateSale,
  useReturnSale,
} from "./model/use-sales"
export { warrantyRemainingDays } from "./lib/warranty-remaining"
export { useSaleReceipts } from "./model/use-sale-receipts"
export { formatReceiptText } from "./lib/format-receipt"
export { combineReceipts } from "./lib/combine-receipts"
export { ReceiptPrintView, ReceiptPaper } from "./ui/ReceiptPrintView"
