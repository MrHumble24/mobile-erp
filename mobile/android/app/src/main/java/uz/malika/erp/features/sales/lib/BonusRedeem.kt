package uz.malika.erp.features.sales.lib

import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Plan how a cart's bonus points are spent, mirroring the server's per-sale
 * limits (ADR 0043): a line may take at most `maxPercent` of its price
 * (half-up to the cent) and never more than it still owes; the cart may take
 * at most the customer's balance. The requested amount is clamped, then shared
 * out in cart order. Pure, all maths in integer cents. Mirrors the web
 * `bonus-redeem.ts`.
 */
object BonusRedeem {
    /** One cart line to pay: its price and what is left after trade-ins (cents). */
    data class Line(val lineId: String, val priceCents: Long, val dueCents: Long)

    /** The planned points spend over a cart. */
    data class Plan(
        /** The most the customer may spend on this cart (cents). */
        val maxCents: Long,
        /** What will be spent: requested, kept between 0 and max (cents). */
        val totalCents: Long,
        /** lineId → points on that line (only lines with points). */
        val byLine: Map<String, Long>,
        /** Per line: price minus trade-ins minus points — the payment basis. */
        val payableLines: List<TradeInPlan.AllocLine>,
    )

    fun plan(lines: List<Line>, requestedCents: Long, balanceCents: Long, maxPercent: BigDecimal): Plan {
        val percent = maxPercent.max(BigDecimal.ZERO)
        val requested = requestedCents.coerceAtLeast(0)
        val balance = balanceCents.coerceAtLeast(0)

        val caps = lines.map { line ->
            val percentCap = (BigDecimal(line.priceCents) * percent)
                .divide(BigDecimal(100), 0, RoundingMode.HALF_UP).toLong()
            minOf(percentCap, line.dueCents.coerceAtLeast(0))
        }
        val capSum = caps.sum()
        val maxCents = minOf(balance, capSum)
        val totalCents = minOf(requested, maxCents)

        var remaining = totalCents
        val byLine = HashMap<String, Long>()
        val payableLines = ArrayList<TradeInPlan.AllocLine>()
        lines.forEachIndexed { index, line ->
            val take = minOf(remaining, caps[index])
            if (take > 0) byLine[line.lineId] = take
            remaining -= take
            payableLines.add(TradeInPlan.AllocLine(line.lineId, line.dueCents.coerceAtLeast(0) - take))
        }
        return Plan(maxCents, totalCents, byLine, payableLines)
    }
}

fun BigDecimal.toCents(): Long = movePointRight(2).setScale(0, RoundingMode.HALF_UP).toLong()
fun Long.fromCents(): BigDecimal = BigDecimal(this).movePointLeft(2)
