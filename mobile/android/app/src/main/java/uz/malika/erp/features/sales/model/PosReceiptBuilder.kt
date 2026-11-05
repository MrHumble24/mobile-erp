package uz.malika.erp.features.sales.model

import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.ReceiptLineItem
import uz.malika.erp.features.sales.lib.PricedCart
import uz.malika.erp.features.sales.lib.PricedLine
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.payments.AccountAmount

/**
 * Builds the POS post-checkout receipt from the priced cart (ADR 0034) so it
 * shows the level, list total and discount locally — works offline. Split out of
 * [PosViewModel] to keep it under the file-size limit.
 */
fun buildPosReceipt(
    id: String,
    cashierName: String,
    level: String,
    priced: PricedCart,
    online: Boolean,
    customerName: String?,
    parts: List<AccountAmount>,
): ReceiptData = ReceiptData(
    receiptId = id,
    soldAt = formatDateTime(System.currentTimeMillis()),
    cashier = cashierName,
    customerName = customerName?.takeIf { it.isNotBlank() },
    items = priced.lines.map(::receiptItem),
    total = priced.totals.payable.toPlainString(),
    warrantyUntil = null,
    pending = !online,
    payments = parts.map { AccountAmount(it.accountCode, it.amount) },
    priceLevelCode = level,
    listTotal = priced.totals.listSum.toPlainString(),
    discountTotal = priced.totals.discountSum.toPlainString(),
)

private fun receiptItem(p: PricedLine): ReceiptLineItem = when (val line = p.line) {
    is CartLine.Unit -> ReceiptLineItem(line.device.modelLabel, line.device.code, p.finalPrice.toPlainString(), null)
    is CartLine.Quantity ->
        ReceiptLineItem(line.product.label, "", p.finalPrice.toPlainString(), null, quantity = line.quantity)
}
