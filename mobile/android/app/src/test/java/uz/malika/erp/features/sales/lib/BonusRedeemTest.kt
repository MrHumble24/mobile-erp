package uz.malika.erp.features.sales.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.math.BigDecimal

/** Bonus-points redeem plan (ADR 0043): mirrors the web `bonus-redeem.ts`, cent-exact.
 *  Test amounts are money; they are converted to cents before calling [BonusRedeem.plan]. */
class BonusRedeemTest {

    private fun line(id: String, price: BigDecimal, due: BigDecimal = price) =
        BonusRedeem.Line(id, price.toCents(), due.toCents())

    private fun plan(
        lines: List<BonusRedeem.Line>,
        requestedMoney: BigDecimal,
        balanceMoney: BigDecimal,
        maxPercent: BigDecimal,
    ) = BonusRedeem.plan(lines, requestedMoney.toCents(), balanceMoney.toCents(), maxPercent)

    @Test
    fun oneLinePaysUpToBalanceAndMaxPercent() {
        // price 1000.00, due 1000.00; balance 50.00; max 50% → cap 500.00; max = 50.00; requested 50.00.
        val plan = plan(listOf(line("a", BigDecimal("1000.00"))), BigDecimal("50.00"), BigDecimal("50.00"), BigDecimal("50"))
        assertEquals(BigDecimal("50.00").toCents(), plan.maxCents)
        assertEquals(BigDecimal("50.00").toCents(), plan.totalCents)
        assertEquals(mapOf("a" to BigDecimal("50.00").toCents()), plan.byLine)
        assertEquals(BigDecimal("950.00").toCents(), plan.payableLines.single().priceCents)
    }

    @Test
    fun maxIsLimitedByMaxPercent() {
        // balance 2000.00 but max 50% of 1000.00 = 500.00 → max 500.00; requested 800.00 clamped.
        val plan = plan(listOf(line("a", BigDecimal("1000.00"))), BigDecimal("800.00"), BigDecimal("2000.00"), BigDecimal("50"))
        assertEquals(BigDecimal("500.00").toCents(), plan.maxCents)
        assertEquals(BigDecimal("500.00").toCents(), plan.totalCents)
    }

    @Test
    fun pointsSharedAcrossTwoLinesInCartOrder() {
        // lines 1000.00 and 400.00; balance 600.00; max 50% → caps 500.00 and 200.00, sum 700.00; max = 600.00.
        val plan = plan(
            listOf(line("a", BigDecimal("1000.00")), line("b", BigDecimal("400.00"))),
            BigDecimal("600.00"), BigDecimal("600.00"), BigDecimal("50"),
        )
        assertEquals(BigDecimal("600.00").toCents(), plan.maxCents)
        assertEquals(BigDecimal("600.00").toCents(), plan.totalCents)
        assertEquals(mapOf("a" to BigDecimal("500.00").toCents(), "b" to BigDecimal("100.00").toCents()), plan.byLine)
        assertEquals(BigDecimal("500.00").toCents(), plan.payableLines.first { it.lineId == "a" }.priceCents)
        assertEquals(BigDecimal("300.00").toCents(), plan.payableLines.first { it.lineId == "b" }.priceCents)
    }

    @Test
    fun lineCapIsLimitedByDue() {
        // price 1000.00, due 300.00; max 50% of price = 500.00 → capped at due 300.00.
        val plan = plan(
            listOf(line("a", BigDecimal("1000.00"), BigDecimal("300.00"))),
            BigDecimal("900.00"), BigDecimal("900.00"), BigDecimal("50"),
        )
        assertEquals(BigDecimal("300.00").toCents(), plan.maxCents)
        assertEquals(BigDecimal("300.00").toCents(), plan.totalCents)
        assertEquals(0L, plan.payableLines.single().priceCents)
    }

    @Test
    fun zeroBalanceOrZeroPercentMeansNoRedeem() {
        val plan = plan(listOf(line("a", BigDecimal("1000.00"))), BigDecimal("50.00"), BigDecimal("0.00"), BigDecimal("50"))
        assertEquals(0L, plan.maxCents)
        assertEquals(0L, plan.totalCents)
        assertEquals(BigDecimal("1000.00").toCents(), plan.payableLines.single().priceCents)

        val plan2 = plan(listOf(line("a", BigDecimal("1000.00"))), BigDecimal("50.00"), BigDecimal("5000.00"), BigDecimal("0"))
        assertEquals(0L, plan2.maxCents)
        assertEquals(0L, plan2.totalCents)
        assertEquals(BigDecimal("1000.00").toCents(), plan2.payableLines.single().priceCents)
    }

    @Test
    fun priceWithFractionalCentsRoundsHalfUp() {
        // price 333.33 → 33333 cents; max 50% → 16666.5 → half-up 16667 = 166.67.
        val plan = plan(listOf(line("a", BigDecimal("333.33"))), BigDecimal("1000.00"), BigDecimal("1000.00"), BigDecimal("50"))
        assertEquals(BigDecimal("166.67").toCents(), plan.maxCents)
    }

    @Test
    fun negativeRequestIsZero() {
        val plan = plan(listOf(line("a", BigDecimal("1000.00"))), BigDecimal("-5.00"), BigDecimal("5000.00"), BigDecimal("50"))
        assertEquals(0L, plan.totalCents)
        assertTrue(plan.byLine.isEmpty())
    }
}
