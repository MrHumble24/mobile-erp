package uz.malika.erp.features.sales.lib

import java.math.BigDecimal
import java.math.BigInteger
import java.math.RoundingMode

/** The three price levels (ADR 0034). A fourth is a server row, never hard-coded. */
object PriceLevel {
    const val RETAIL = "RETAIL"
    const val WHOLESALE = "WHOLESALE"
    const val PARTNER = "PARTNER"
    const val DEFAULT = RETAIL
    val ALL = listOf(RETAIL, WHOLESALE, PARTNER)

    fun labelKey(code: String): String = when (code) {
        WHOLESALE -> "pricing.levelWholesale"
        PARTNER -> "pricing.levelPartner"
        else -> "pricing.levelRetail"
    }
}

enum class DiscountMode { PERCENT, AMOUNT }

/** A discount the seller set on a line (or the whole cart). */
data class Discount(val mode: DiscountMode, val value: BigDecimal)

/** The store's discount settings (from `GET /settings`). */
data class DiscountSettings(
    val enabled: Boolean = false,
    val percentAllowed: Boolean = true,
    val amountAllowed: Boolean = true,
    val maxPercent: BigDecimal = BigDecimal.ZERO,
    val presetsPercent: List<BigDecimal> = emptyList(),
    val presetsAmount: List<BigDecimal> = emptyList(),
)

/** A discount the seller tried that the limit refuses: an i18n key + its params. */
data class DiscountRejection(val key: String, val params: Map<String, Any?>? = null)

/**
 * The money rules of a priced till line (ADR 0034), ported 1:1 from the server's
 * `lib/checkout-pricing.ts` so the client refuses a discount before the server
 * does and the two never disagree on rounding. All BigDecimal, never a float.
 * Pure — unit-tested.
 */
object Pricing {
    private val HUNDRED = BigDecimal(100)
    private val TOLERANCE = BigDecimal("0.0001")

    private fun round2(v: BigDecimal): BigDecimal = v.setScale(2, RoundingMode.HALF_UP)

    /** The list price at [level] from a resolved `{RETAIL,WHOLESALE,PARTNER}` map; null = none. */
    fun levelPrice(prices: Map<String, String?>?, level: String): BigDecimal? =
        prices?.get(level)?.trim()?.takeIf { it.isNotEmpty() }?.toBigDecimalOrNull()

    /** The rounded discount amount for a line (0 when no discount). Mirrors server round2. */
    fun discountAmount(listPrice: BigDecimal, discount: Discount?): BigDecimal {
        if (discount == null) return BigDecimal.ZERO
        return when (discount.mode) {
            DiscountMode.PERCENT -> round2(listPrice.multiply(discount.value).divide(HUNDRED))
            DiscountMode.AMOUNT -> round2(discount.value)
        }
    }

    /** Final price for a line = list − discount. */
    fun finalPrice(listPrice: BigDecimal, discount: Discount?): BigDecimal =
        listPrice.subtract(discountAmount(listPrice, discount))

    /** The limit percent a cashier may give: the larger of the store max and the customer's standing. */
    fun cap(settings: DiscountSettings, standingPercent: BigDecimal): BigDecimal =
        settings.maxPercent.max(standingPercent)

    /**
     * Why this discount is refused (null = allowed). [canUnlimited] skips the cap.
     * Order mirrors the server: off → above list → above the cap.
     */
    fun discountRejection(
        listPrice: BigDecimal,
        discount: Discount?,
        settings: DiscountSettings,
        standingPercent: BigDecimal,
        canUnlimited: Boolean,
    ): DiscountRejection? {
        if (discount == null || discount.value.signum() == 0) return null
        if (!settings.enabled) return DiscountRejection("pricing.errorDiscountDisabled")
        val amount = discountAmount(listPrice, discount)
        if (amount > listPrice) return DiscountRejection("pricing.errorDiscountAboveList")
        if (canUnlimited) return null
        val cap = cap(settings, standingPercent)
        val percent = when (discount.mode) {
            DiscountMode.PERCENT -> discount.value
            DiscountMode.AMOUNT ->
                if (listPrice.signum() == 0) BigDecimal.ZERO
                else amount.divide(listPrice, 6, RoundingMode.HALF_UP).multiply(HUNDRED)
        }
        if (percent.subtract(cap) > TOLERANCE) {
            return DiscountRejection("pricing.errorDiscountTooHigh", mapOf("max" to plain(cap)))
        }
        return null
    }

    /**
     * Spread a cart-level discount [cartAmount] across lines in proportion to
     * their [lineListPrices], returning one per-line amount that sums to
     * [cartAmount] EXACTLY (largest-remainder in integer cents — no money lost or
     * invented). A zero total or zero cart discount gives all zeros.
     */
    fun spreadCartDiscount(
        lineListPrices: List<BigDecimal>,
        cartAmount: BigDecimal,
    ): List<BigDecimal> {
        val n = lineListPrices.size
        if (n == 0) return emptyList()
        val zero = BigDecimal.ZERO.setScale(2)
        val target = cents(round2(cartAmount))
        if (target.signum() <= 0) return List(n) { zero }
        val weights = lineListPrices.map { cents(it).max(BigInteger.ZERO) }
        val totalWeight = weights.fold(BigInteger.ZERO, BigInteger::add)
        if (totalWeight.signum() == 0) return List(n) { zero }

        val floors = ArrayList<BigInteger>(n)
        val remainders = ArrayList<BigInteger>(n)
        for (w in weights) {
            val numerator = target.multiply(w)
            floors.add(numerator.divide(totalWeight))
            remainders.add(numerator.mod(totalWeight))
        }
        var leftover = target.subtract(floors.fold(BigInteger.ZERO, BigInteger::add))
        // Hand the leftover cents to the largest remainders first (stable by index).
        val order = (0 until n).sortedWith(
            compareByDescending<Int> { remainders[it] }.thenBy { it },
        )
        val result = floors.toMutableList()
        var i = 0
        while (leftover.signum() > 0 && i < order.size) {
            result[order[i]] = result[order[i]].add(BigInteger.ONE)
            leftover = leftover.subtract(BigInteger.ONE)
            i++
        }
        return result.map { BigDecimal(it).movePointLeft(2) }
    }

    private fun cents(v: BigDecimal): BigInteger =
        v.movePointRight(2).setScale(0, RoundingMode.HALF_UP).toBigIntegerExact()

    private fun plain(v: BigDecimal): String = v.stripTrailingZeros().toPlainString()
}
