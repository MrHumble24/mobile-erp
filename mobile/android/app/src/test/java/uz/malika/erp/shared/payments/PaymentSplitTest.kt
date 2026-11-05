package uz.malika.erp.shared.payments

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.math.BigDecimal

/** The money-movement rules a sale is tendered by — the same online and offline. */
class PaymentSplitTest {

    private fun bd(v: String) = BigDecimal(v)

    private fun List<AccountAmount>.flat() = map { it.accountCode to it.amount.toPlainString() }

    @Test
    fun cashPutsTheWholePriceInOneAccount() {
        val parts = PaymentSplit.parts(PaymentMethod.CASH, bd("1500"), emptyMap(), listOf("CASH", "CARD"))
        assertEquals(listOf("CASH" to "1500"), parts.flat())
    }

    @Test
    fun cardPutsTheWholePriceInCard() {
        val parts = PaymentSplit.parts(PaymentMethod.CARD, bd("1500"), emptyMap(), listOf("CASH", "CARD"))
        assertEquals(listOf("CARD" to "1500"), parts.flat())
    }

    @Test
    fun splitDropsZeroAndBlankAccountsAndKeepsOrder() {
        val parts = PaymentSplit.parts(
            PaymentMethod.SPLIT,
            bd("1000"),
            mapOf("CASH" to bd("600"), "CARD" to bd("400"), "OTHER" to BigDecimal.ZERO),
            listOf("CASH", "CARD", "OTHER"),
        )
        assertEquals(listOf("CASH" to "600", "CARD" to "400"), parts.flat())
    }

    @Test
    fun remainingIsZeroWhenPartsAddUp() {
        val parts = listOf(AccountAmount("CASH", bd("600")), AccountAmount("CARD", bd("400")))
        assertEquals(0, PaymentSplit.remaining(bd("1000"), parts).signum())
        assertEquals("200", PaymentSplit.remaining(bd("1000"), listOf(AccountAmount("CASH", bd("800")))).toPlainString())
    }

    /** The coordinator's required case: a split that straddles a phone boundary. */
    @Test
    fun allocateWaterfallsCashThenCardAcrossPhones() {
        val alloc = PaymentSplit.allocate(
            linePrices = listOf(bd("500"), bd("700")),
            parts = listOf(AccountAmount("CASH", bd("800")), AccountAmount("CARD", bd("400"))),
        )
        assertEquals(listOf("CASH" to "500"), alloc[0].flat())
        assertEquals(listOf("CASH" to "300", "CARD" to "400"), alloc[1].flat())
    }

    @Test
    fun allocateGivesEachLineItsOwnPriceForSingleAccount() {
        val alloc = PaymentSplit.allocate(
            linePrices = listOf(bd("100"), bd("250.50")),
            parts = listOf(AccountAmount("CASH", bd("350.50"))),
        )
        assertEquals(listOf("CASH" to "100"), alloc[0].flat())
        assertEquals(listOf("CASH" to "250.50"), alloc[1].flat())
    }

    @Test
    fun everyLineAllocationSumsToItsPrice() {
        val prices = listOf(bd("500"), bd("700"))
        val parts = listOf(AccountAmount("CASH", bd("800")), AccountAmount("CARD", bd("400")))
        val alloc = PaymentSplit.allocate(prices, parts)
        prices.forEachIndexed { i, price ->
            val sum = alloc[i].fold(BigDecimal.ZERO) { a, p -> a + p.amount }
            assertTrue("line $i sums to its price", sum.compareTo(price) == 0)
        }
    }
}
