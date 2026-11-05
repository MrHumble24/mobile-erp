package uz.malika.erp.features.sales.lib

import uz.malika.erp.features.sales.data.CartLine
import java.math.BigDecimal

/**
 * One cart line priced at the current level (ADR 0034). [editable] is true when
 * the line has no list price (old behaviour) or the seller is overriding it —
 * then the seller's typed price is the final price and no discount is recorded.
 * Otherwise the final price is `listTotal − discountAmount`.
 */
data class PricedLine(
    val line: CartLine,
    val listTotal: BigDecimal?,
    val finalPrice: BigDecimal,
    val discountAmount: BigDecimal,
    /** The discount actually sent for this line (null for an editable/no-list line). */
    val effectiveDiscount: Discount?,
    val editable: Boolean,
    /** A client-side limit breach for this line's discount (null = allowed). */
    val rejection: DiscountRejection?,
)

/** The cart totals the till shows: Σ list, Σ discount, amount to pay. */
data class CartTotals(val listSum: BigDecimal, val discountSum: BigDecimal, val payable: BigDecimal)

/** A fully priced cart: the per-line breakdown, the totals, and the first limit breach. */
data class PricedCart(val lines: List<PricedLine>, val totals: CartTotals, val rejection: DiscountRejection?) {
    val hasRejection: Boolean get() = rejection != null
}

/**
 * Prices the whole cart at [level] (ADR 0034), the single brain the till renders
 * and checks out from. A [cartDiscount] is spread across the list-priced lines in
 * proportion to their list prices and ends up as per-line amounts (so the server,
 * which only knows lines, still receives exact per-line discounts). Pure.
 */
object CartPricing {

    fun price(
        lines: List<CartLine>,
        level: String,
        cartDiscount: Discount?,
        overriding: Set<String>,
        settings: DiscountSettings,
        standingPercent: BigDecimal,
        canOverride: Boolean,
        canUnlimited: Boolean,
    ): PricedCart {
        val lists = lines.map { it.listTotal(level) }
        val editable = lines.mapIndexed { i, l -> lists[i] == null || (canOverride && l.key in overriding) }

        val spread: List<BigDecimal> = if (cartDiscount != null) {
            val weights = lines.mapIndexed { i, _ -> if (!editable[i] && lists[i] != null) lists[i]!! else BigDecimal.ZERO }
            Pricing.spreadCartDiscount(weights, cartDiscountAmount(cartDiscount, weights.fold(BigDecimal.ZERO, BigDecimal::add)))
        } else {
            List(lines.size) { BigDecimal.ZERO }
        }

        val priced = lines.mapIndexed { i, line ->
            val list = lists[i]
            if (editable[i]) {
                PricedLine(line, list, line.typedTotal, BigDecimal.ZERO, null, true, null)
            } else {
                val disc = if (cartDiscount != null) Discount(DiscountMode.AMOUNT, spread[i]) else line.discount
                val amount = Pricing.discountAmount(list!!, disc)
                val rejection = Pricing.discountRejection(list, disc, settings, standingPercent, canUnlimited)
                PricedLine(line, list, list.subtract(amount), amount, disc, false, rejection)
            }
        }

        var listSum = BigDecimal.ZERO
        var payable = BigDecimal.ZERO
        for (p in priced) {
            listSum = listSum.add(p.listTotal ?: p.line.typedTotal)
            payable = payable.add(p.finalPrice)
        }
        val totals = CartTotals(listSum = listSum, discountSum = listSum.subtract(payable), payable = payable)
        return PricedCart(priced, totals, priced.firstNotNullOfOrNull { it.rejection })
    }

    /** The cart discount as a money amount, capped at the priceable list total. */
    private fun cartDiscountAmount(discount: Discount, listSum: BigDecimal): BigDecimal =
        when (discount.mode) {
            DiscountMode.PERCENT -> listSum.multiply(discount.value).movePointLeft(2).setScale(2, java.math.RoundingMode.HALF_UP)
            DiscountMode.AMOUNT -> discount.value.min(listSum)
        }
}
