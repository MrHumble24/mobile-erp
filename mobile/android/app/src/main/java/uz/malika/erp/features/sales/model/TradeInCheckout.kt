package uz.malika.erp.features.sales.model

import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.AppException
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.lib.PricedLine
import uz.malika.erp.features.sales.lib.TradeInPlan
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit
import java.math.BigDecimal
import java.math.RoundingMode

/** The outcome of a trade-in checkout run. */
data class TradeInCheckoutResult(
    val saleIds: List<String>,
    /** Cart line keys whose sale committed (removed from the cart). */
    val committedLineKeys: Set<String>,
    /** Trade-in draft ids already sent (never re-sent on a retry). */
    val committedTradeInIds: Set<String>,
    /**
     * Set when a line failed: the server's message (it is clear for
     * `TRADE_IN_FORBIDDEN` etc.) or an i18n key. Shown via `t()`, which returns a
     * non-key string unchanged.
     */
    val error: String? = null,
)

/**
 * Posts a trade-in cart one sale per line, directly online (ADR 0039): the server
 * refuses trade-ins on the sync replay, so these are never queued. Each trade-in
 * is allocated to a line that can carry it (pure [TradeInPlan]); that line's sale
 * carries its full price, its share of the tender, and its trade-ins. Lines commit
 * sequentially; a committed line's trade-ins are recorded so a retry after a
 * partial failure never sends the same trade-in twice. Stops at the first failure.
 */
object TradeInCheckout {

    private fun BigDecimal.toCents(): Long = movePointRight(2).setScale(0, RoundingMode.HALF_UP).toLong()
    private fun Long.fromCents(): BigDecimal = BigDecimal(this).movePointLeft(2)

    /** The plan for the current cart: amount to pay + whether every trade-in fits a line. */
    fun plan(lines: List<PricedLine>, tradeIns: List<TradeInDraft>): TradeInPlan.Plan {
        val allocLines = lines.map { TradeInPlan.AllocLine(it.line.key, it.finalPrice.toCents()) }
        val items = tradeIns.map { TradeInPlan.AllocItem(it.id, it.value.toCents()) }
        return TradeInPlan.plan(allocLines, items)
    }

    suspend fun run(
        lines: List<PricedLine>,
        level: String,
        customerId: String?,
        customerName: String?,
        customerPhone: String?,
        notes: String?,
        tradeIns: List<TradeInDraft>,
        parts: List<AccountAmount>,
        post: suspend (JsonObject) -> String,
    ): TradeInCheckoutResult {
        val plan = plan(lines, tradeIns)
        val byId = tradeIns.associateBy { it.id }
        // Per-line payable (price − its trade-ins), in cart order, to split the tender over.
        val payable = plan.payableLines.map { it.priceCents.fromCents() }
        val allocation = if (parts.isEmpty()) lines.map { emptyList() } else PaymentSplit.allocate(payable, parts)

        val saleIds = ArrayList<String>()
        val committedLines = LinkedHashSet<String>()
        val committedTradeIns = LinkedHashSet<String>()

        lines.forEachIndexed { i, priced ->
            val key = priced.line.key
            val lineTradeIns = (plan.itemsByLine[key] ?: emptyList()).mapNotNull { byId[it] }
            val payload = payloadFor(priced, level, customerId, customerName, customerPhone, notes, allocation.getOrElse(i) { emptyList() }, lineTradeIns)
            try {
                saleIds.add(post(payload))
                committedLines.add(key)
                committedTradeIns.addAll(lineTradeIns.map { it.id })
            } catch (e: AppException) {
                return TradeInCheckoutResult(
                    saleIds = saleIds,
                    committedLineKeys = committedLines,
                    committedTradeInIds = committedTradeIns,
                    error = e.message?.takeIf { it.isNotBlank() } ?: "common.error",
                )
            }
        }
        return TradeInCheckoutResult(saleIds, committedLines, committedTradeIns)
    }

    private fun payloadFor(
        priced: PricedLine,
        level: String,
        customerId: String?,
        customerName: String?,
        customerPhone: String?,
        notes: String?,
        payments: List<AccountAmount>,
        tradeIns: List<TradeInDraft>,
    ): JsonObject = when (val line = priced.line) {
        is CartLine.Unit -> SaleCreate.payload(
            imei = line.device.imei,
            serialNumber = line.device.serialNumber,
            salePrice = priced.finalPrice,
            customerId = customerId,
            customerName = customerName,
            customerPhone = customerPhone,
            warrantyDays = line.warrantyDays.trim().toIntOrNull(),
            notes = notes,
            payments = payments,
            priceLevelCode = level,
            discount = priced.effectiveDiscount,
            listPrice = priced.listTotal,
            tradeIns = tradeIns,
        )
        is CartLine.Quantity -> SaleCreate.quantityPayload(
            modelId = line.product.modelId,
            quantity = line.quantity,
            salePrice = priced.finalPrice,
            customerId = customerId,
            customerName = customerName,
            customerPhone = customerPhone,
            notes = notes,
            payments = payments,
            priceLevelCode = level,
            discount = priced.effectiveDiscount,
            listPrice = priced.listTotal,
            tradeIns = tradeIns,
        )
    }
}
