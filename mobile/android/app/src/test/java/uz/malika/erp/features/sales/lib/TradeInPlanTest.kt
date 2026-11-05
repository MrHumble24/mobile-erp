package uz.malika.erp.features.sales.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Trade-in allocation + amount-to-pay (ADR 0039): cent-exact, mirrors the web. */
class TradeInPlanTest {

    private fun line(id: String, cents: Long) = TradeInPlan.AllocLine(id, cents)
    private fun item(id: String, cents: Long) = TradeInPlan.AllocItem(id, cents)

    @Test
    fun noTradeInsPaysTheFullCartTotal() {
        val plan = TradeInPlan.plan(listOf(line("a", 500_000_00), line("b", 300_000_00)), emptyList())
        assertTrue(plan.ok)
        assertEquals(0L, plan.tradeInTotalCents)
        assertEquals(800_000_00L, plan.amountToPayCents)
    }

    @Test
    fun amountToPayIsCartTotalMinusTradeIns() {
        // Cart 6,500,000; a 1,000,000 trade-in → pay 5,500,000 (the web walk-through figure).
        val plan = TradeInPlan.plan(listOf(line("a", 6_500_000_00)), listOf(item("t1", 1_000_000_00)))
        assertTrue(plan.ok)
        assertEquals(5_500_000_00L, plan.amountToPayCents)
        // The one line's payable is its price minus the trade-in put on it.
        assertEquals(5_500_000_00L, plan.payableLines.single().priceCents)
        assertEquals(listOf("t1"), plan.itemsByLine["a"])
    }

    @Test
    fun biggestTradeInClaimsTheBiggestLine() {
        val plan = TradeInPlan.plan(
            listOf(line("big", 1_000_000_00), line("small", 200_000_00)),
            listOf(item("t1", 150_000_00), item("t2", 900_000_00)),
        )
        assertTrue(plan.ok)
        // t2 (900k) goes on the big line; t1 (150k) then onto whichever still fits.
        assertTrue(plan.itemsByLine["big"]!!.contains("t2"))
        assertEquals(150_000_00L, plan.amountToPayCents) // 1,200,000 − 1,050,000
    }

    @Test
    fun aTradeInThatFitsNoSingleLineIsRejected() {
        // Two 500k lines, a 600k trade-in: it exceeds every single line.
        val plan = TradeInPlan.plan(
            listOf(line("a", 500_000_00), line("b", 500_000_00)),
            listOf(item("t1", 600_000_00)),
        )
        assertFalse(plan.ok)
        assertEquals("t1", plan.unplaceableId)
    }

    @Test
    fun twoTradeInsSplitAcrossTwoLines() {
        val plan = TradeInPlan.plan(
            listOf(line("a", 500_000_00), line("b", 500_000_00)),
            listOf(item("t1", 400_000_00), item("t2", 400_000_00)),
        )
        assertTrue(plan.ok)
        assertEquals(200_000_00L, plan.amountToPayCents) // 1,000,000 − 800,000
        assertEquals(1, plan.itemsByLine["a"]!!.size)
        assertEquals(1, plan.itemsByLine["b"]!!.size)
    }
}
