package uz.malika.erp.features.credit.lib

import java.math.BigDecimal
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Pure payment-plan arithmetic for customer credit (ADR 0035). No interest, no
 * fee — only splitting a principal into parts. Money is handled in integer cents
 * (Long) so nothing drifts through doubles, mirroring the web `credit-plan.ts`
 * and the server's Decimal maths. Dates are `YYYY-MM-DD` (the DATE instalments
 * the API stores at 00:00 UTC). No Android/HTTP here — unit-tested directly.
 */
object CreditPlan {

    private val ISO: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    enum class Frequency { MONTH, WEEK }

    /** Major-unit money → integer cents (2-dp, half-up). */
    fun toCents(value: BigDecimal): Long = value.movePointRight(2).setScale(0, java.math.RoundingMode.HALF_UP).toLong()

    /** Parse a typed money string to cents; blank / bad input → 0. */
    fun toCents(value: String?): Long {
        if (value.isNullOrBlank()) return 0
        return runCatching { toCents(BigDecimal(value.trim())) }.getOrDefault(0)
    }

    /** Integer cents → a 2-dp major-unit decimal. */
    fun fromCents(cents: Long): BigDecimal = BigDecimal(cents).movePointLeft(2)

    /**
     * Split [totalCents] into [parts] amounts, as even as possible, the rounding
     * remainder landing on the LAST part. `parts < 1` or a negative total → empty.
     */
    fun evenSplitCents(totalCents: Long, parts: Int): List<Long> {
        if (parts < 1 || totalCents < 0) return emptyList()
        val base = totalCents / parts
        return List(parts) { i -> if (i == parts - 1) totalCents - base * (parts - 1) else base }
    }

    /**
     * An even plan: [totalCents] split across [parts], the first due on [firstDue]
     * (`YYYY-MM-DD`), each following part one month or one week later. The remainder
     * rides the last part. Returns (dueDate, amountCents) pairs the API expects.
     */
    fun buildEvenPlan(totalCents: Long, parts: Int, firstDue: String, every: Frequency): List<Pair<String, Long>> {
        val first = runCatching { LocalDate.parse(firstDue, ISO) }.getOrNull() ?: return emptyList()
        val amounts = evenSplitCents(totalCents, parts)
        return amounts.mapIndexed { i, cents ->
            val date = if (every == Frequency.MONTH) first.plusMonths(i.toLong()) else first.plusWeeks(i.toLong())
            date.format(ISO) to cents
        }
    }

    /**
     * What is still unplanned, in cents: cart total − down payment − Σ instalments.
     * Zero means the plan balances; the till blocks checkout until it is zero.
     */
    fun planRemainingCents(cartTotalCents: Long, downPaymentCents: Long, instalmentCents: List<Long>): Long =
        cartTotalCents - downPaymentCents - instalmentCents.sum()

    /**
     * True when selling this credit would push the customer's owed principal past
     * their effective limit. [newUnpaidCents] = cart total − down payment. A null
     * limit is no cap — there is never any interest.
     */
    fun wouldExceedLimit(currentOutstandingCents: Long, newUnpaidCents: Long, limitCents: Long?): Boolean {
        if (limitCents == null) return false
        return currentOutstandingCents + newUnpaidCents > limitCents
    }

    /** True when a due date (`YYYY-MM-DD`) is before today, in UTC days. */
    fun isPastDue(dueDate: String, today: LocalDate = LocalDate.now(java.time.ZoneOffset.UTC)): Boolean {
        val due = runCatching { LocalDate.parse(dueDate, ISO) }.getOrNull() ?: return false
        return due.isBefore(today)
    }

    /** Today as `YYYY-MM-DD` in UTC — the default first due date. */
    fun todayIso(): String = LocalDate.now(java.time.ZoneOffset.UTC).format(ISO)
}
