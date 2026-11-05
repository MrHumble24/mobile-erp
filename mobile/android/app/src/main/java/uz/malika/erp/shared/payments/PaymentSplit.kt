package uz.malika.erp.shared.payments

import java.math.BigDecimal

/** One tender part: how much money lands in one account. */
data class AccountAmount(val accountCode: String, val amount: BigDecimal)

/** How the customer pays a sale. SPLIT assigns an amount per account. */
enum class PaymentMethod { CASH, CARD, SPLIT }

/**
 * The money-movement rules for a (possibly split) sale, shared by POS online and
 * the offline queue so a sale is tendered the same way whichever path it takes.
 * Pure (no Android, no HTTP) — unit-tested directly. BigDecimal throughout; money
 * is never a float.
 */
object PaymentSplit {
    const val CASH = "CASH"
    const val CARD = "CARD"

    /** The default when nothing is chosen: the whole price in CASH. */
    fun defaultMethod(): PaymentMethod = PaymentMethod.CASH

    /**
     * The cart-level tender parts for a chosen method. Cash/Card put the whole
     * [total] in one account; Split reads the per-account amounts (zero/blank
     * accounts are dropped), kept in [accounts] order so the waterfall below
     * drains CASH before CARD.
     */
    fun parts(
        method: PaymentMethod,
        total: BigDecimal,
        splitAmounts: Map<String, BigDecimal>,
        accounts: List<String>,
    ): List<AccountAmount> = when (method) {
        PaymentMethod.CASH -> listOf(AccountAmount(CASH, total))
        PaymentMethod.CARD -> listOf(AccountAmount(CARD, total))
        PaymentMethod.SPLIT -> accounts.mapNotNull { code ->
            splitAmounts[code]?.takeIf { it.signum() > 0 }?.let { AccountAmount(code, it) }
        }
    }

    /** Sum of the assigned parts. */
    fun assigned(parts: List<AccountAmount>): BigDecimal =
        parts.fold(BigDecimal.ZERO) { acc, p -> acc + p.amount }

    /** Still to assign so the split adds up to the price (zero = valid). */
    fun remaining(total: BigDecimal, parts: List<AccountAmount>): BigDecimal =
        total - assigned(parts)

    /**
     * Fan the cart-level [parts] across the ordered [linePrices], one output list
     * of payments per line. Walk the phones in cart order, paying each phone's
     * price from the first part until it is used up, then the next; a phone that
     * straddles the boundary gets two lines, every other phone one. Each line's
     * payments then sum to its own price exactly (what the server checks), as long
     * as the parts sum to the cart total — which the "left to assign = 0" gate
     * guarantees.
     */
    fun allocate(
        linePrices: List<BigDecimal>,
        parts: List<AccountAmount>,
    ): List<List<AccountAmount>> {
        val live = parts.filter { it.amount.signum() > 0 }
        val codes = live.map { it.accountCode }
        val remaining = live.map { it.amount }.toMutableList()
        var idx = 0
        return linePrices.map { price ->
            var need = price
            val lines = ArrayList<AccountAmount>()
            while (need.signum() > 0 && idx < remaining.size) {
                val take = need.min(remaining[idx])
                if (take.signum() > 0) {
                    lines.add(AccountAmount(codes[idx], take))
                    need -= take
                    remaining[idx] -= take
                }
                if (remaining[idx].signum() == 0) idx++
            }
            lines
        }
    }
}
