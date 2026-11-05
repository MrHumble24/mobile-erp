package uz.malika.erp.features.credit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.credit.lib.CreditPlan
import java.time.LocalDate

/** The customer-credit plan arithmetic (ADR 0035): cent-exact, no interest/fee. */
class CreditPlanTest {

    @Test
    fun evenSplitSumsExactlyWithAnAwkwardAmount() {
        // 100.00 over 3 parts: 33.33, 33.33, 33.34 → sums back to 100.00.
        val parts = CreditPlan.evenSplitCents(10_000, 3)
        assertEquals(listOf(3_333L, 3_333L, 3_334L), parts)
        assertEquals(10_000L, parts.sum())
    }

    @Test
    fun evenSplitRemainderRidesTheLastPart() {
        val parts = CreditPlan.evenSplitCents(10_001, 4) // 25.0025 → 2500,2500,2500,2501
        assertEquals(listOf(2_500L, 2_500L, 2_500L, 2_501L), parts)
        assertEquals(10_001L, parts.sum())
    }

    @Test
    fun evenSplitRejectsZeroParts() {
        assertTrue(CreditPlan.evenSplitCents(10_000, 0).isEmpty())
    }

    @Test
    fun planRemainingIsZeroWhenDownPlusPartsEqualTotal() {
        // total 1,000,000; down 400,000; two parts 300,000 each.
        val remaining = CreditPlan.planRemainingCents(100_000_000, 40_000_000, listOf(30_000_000, 30_000_000))
        assertEquals(0L, remaining)
    }

    @Test
    fun planRemainingIsNonZeroWhenPartsDoNotAddUp() {
        val remaining = CreditPlan.planRemainingCents(100_000_000, 0, listOf(30_000_000, 30_000_000))
        assertEquals(40_000_000L, remaining)
    }

    @Test
    fun buildEvenPlanSpreadsMonthlyWithTheRemainderLast() {
        val plan = CreditPlan.buildEvenPlan(10_000, 3, "2026-01-31", CreditPlan.Frequency.MONTH)
        assertEquals(3, plan.size)
        // Monthly from Jan 31, clamped to each month's last day.
        assertEquals("2026-01-31", plan[0].first)
        assertEquals("2026-02-28", plan[1].first)
        assertEquals("2026-03-31", plan[2].first)
        assertEquals(10_000L, plan.sumOf { it.second })
        assertEquals(3_334L, plan[2].second)
    }

    @Test
    fun buildEvenPlanSpreadsWeekly() {
        val plan = CreditPlan.buildEvenPlan(9_000, 3, "2026-01-01", CreditPlan.Frequency.WEEK)
        assertEquals(listOf("2026-01-01", "2026-01-08", "2026-01-15"), plan.map { it.first })
    }

    @Test
    fun wouldExceedLimitRespectsANullCap() {
        assertFalse(CreditPlan.wouldExceedLimit(50_000_00, 50_000_00, null))
    }

    @Test
    fun wouldExceedLimitComparesPrincipalOnly() {
        // current 60.00 + new 50.00 = 110.00 > limit 100.00.
        assertTrue(CreditPlan.wouldExceedLimit(6_000, 5_000, 10_000))
        assertFalse(CreditPlan.wouldExceedLimit(6_000, 3_000, 10_000))
    }

    @Test
    fun isPastDueIsTrueOnlyBeforeToday() {
        val today = LocalDate.of(2026, 6, 15)
        assertTrue(CreditPlan.isPastDue("2026-06-14", today))
        assertFalse(CreditPlan.isPastDue("2026-06-15", today))
        assertFalse(CreditPlan.isPastDue("2026-06-16", today))
    }

    @Test
    fun toCentsRoundsHalfUp() {
        assertEquals(1_235L, CreditPlan.toCents("12.345"))
        assertEquals(0L, CreditPlan.toCents(""))
    }
}
