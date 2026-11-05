package uz.malika.erp.features.sales.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit
import java.math.BigDecimal

/** The priced-checkout money rules, mirroring the server's checkout-pricing. */
class PricingTest {

    private fun bd(v: String) = BigDecimal(v)
    private val settings = DiscountSettings(enabled = true, maxPercent = bd("5"))

    @Test
    fun levelPricePicksThePriceForTheChosenLevel() {
        val prices = mapOf("RETAIL" to "1200.00", "WHOLESALE" to "1100.00", "PARTNER" to null)
        assertEquals(bd("1200.00"), Pricing.levelPrice(prices, PriceLevel.RETAIL))
        assertEquals(bd("1100.00"), Pricing.levelPrice(prices, PriceLevel.WHOLESALE))
        assertNull(Pricing.levelPrice(prices, PriceLevel.PARTNER))
        assertNull(Pricing.levelPrice(null, PriceLevel.RETAIL))
    }

    @Test
    fun percentDiscountRoundsLikeTheServer() {
        // 1333.33 * 7.5% = 99.99975 -> 100.00
        val amount = Pricing.discountAmount(bd("1333.33"), Discount(DiscountMode.PERCENT, bd("7.5")))
        assertEquals(bd("100.00"), amount)
        assertEquals(bd("1233.33"), Pricing.finalPrice(bd("1333.33"), Discount(DiscountMode.PERCENT, bd("7.5"))))
    }

    @Test
    fun amountDiscountSubtractsTheFixedValue() {
        val d = Discount(DiscountMode.AMOUNT, bd("50"))
        assertEquals(bd("50.00"), Pricing.discountAmount(bd("1200"), d))
        assertEquals(bd("1150.00"), Pricing.finalPrice(bd("1200"), d))
    }

    @Test
    fun aDiscountOverTheCashierLimitIsRefused() {
        val r = Pricing.discountRejection(bd("1000"), Discount(DiscountMode.PERCENT, bd("8")), settings, BigDecimal.ZERO, false)
        assertEquals("pricing.errorDiscountTooHigh", r?.key)
        assertEquals("5", r?.params?.get("max"))
    }

    @Test
    fun theCustomersStandingDiscountRaisesTheCashierLimit() {
        // 8% is over the 5% cashier max, but the customer's 10% standing allows it.
        val allowed = Pricing.discountRejection(bd("1000"), Discount(DiscountMode.PERCENT, bd("8")), settings, bd("10"), false)
        assertNull(allowed)
        // 12% is over both.
        val refused = Pricing.discountRejection(bd("1000"), Discount(DiscountMode.PERCENT, bd("12")), settings, bd("10"), false)
        assertEquals("pricing.errorDiscountTooHigh", refused?.key)
        assertEquals("10", refused?.params?.get("max"))
    }

    @Test
    fun anAmountDiscountAboveTheListPriceIsRefused() {
        val r = Pricing.discountRejection(bd("100"), Discount(DiscountMode.AMOUNT, bd("150")), settings, BigDecimal.ZERO, true)
        assertEquals("pricing.errorDiscountAboveList", r?.key)
    }

    @Test
    fun anAmountDiscountOverTheLimitAsAPercentIsRefused() {
        // 80 / 1000 = 8% > 5% cap.
        val r = Pricing.discountRejection(bd("1000"), Discount(DiscountMode.AMOUNT, bd("80")), settings, BigDecimal.ZERO, false)
        assertEquals("pricing.errorDiscountTooHigh", r?.key)
    }

    @Test
    fun unlimitedSkipsTheCap() {
        assertNull(Pricing.discountRejection(bd("1000"), Discount(DiscountMode.PERCENT, bd("50")), settings, BigDecimal.ZERO, true))
    }

    @Test
    fun aDiscountWhileDiscountsAreOffIsRefused() {
        val off = settings.copy(enabled = false)
        val r = Pricing.discountRejection(bd("1000"), Discount(DiscountMode.PERCENT, bd("1")), off, BigDecimal.ZERO, false)
        assertEquals("pricing.errorDiscountDisabled", r?.key)
    }

    @Test
    fun spreadingACartDiscountOverThreeAwkwardLinesAddsUpExactly() {
        // Awkward prices + an awkward total: the parts must still sum to the cent.
        val lines = listOf(bd("333.33"), bd("666.67"), bd("100.01"))
        val cart = bd("100.00")
        val parts = Pricing.spreadCartDiscount(lines, cart)
        assertEquals(3, parts.size)
        val sum = parts.fold(BigDecimal.ZERO) { a, b -> a + b }
        assertEquals(bd("100.00"), sum.setScale(2))
        // No line discount exceeds its own list price.
        parts.forEachIndexed { i, p -> assertTrue(p <= lines[i]) }
    }

    @Test
    fun spreadingIsProportionalAndZeroSafe() {
        val zeros = Pricing.spreadCartDiscount(listOf(bd("10"), bd("30")), BigDecimal.ZERO)
        assertTrue(zeros.all { it.signum() == 0 })
        // 40 total, 100 cart discount over 25%/75% split -> 10 / 30.
        val parts = Pricing.spreadCartDiscount(listOf(bd("10"), bd("30")), bd("40"))
        assertEquals(listOf(bd("10.00"), bd("30.00")), parts)
    }

    @Test
    fun theAmountToPayFeedsTheSplitExactly() {
        // Two priced lines, each discounted, feed their final prices to the split.
        val finals = listOf(
            Pricing.finalPrice(bd("1200"), Discount(DiscountMode.PERCENT, bd("5"))), // 1140.00
            Pricing.finalPrice(bd("300"), Discount(DiscountMode.AMOUNT, bd("30"))), // 270
        )
        val amountToPay = finals.fold(BigDecimal.ZERO) { a, b -> a + b } // 1410.00
        val parts = listOf(AccountAmount("CASH", bd("1000")), AccountAmount("CARD", amountToPay - bd("1000")))
        val perLine = PaymentSplit.allocate(finals, parts)
        // Each line's payments sum to its own final price.
        perLine.forEachIndexed { i, pays ->
            val paid = pays.fold(BigDecimal.ZERO) { a, p -> a + p.amount }
            assertEquals(finals[i].setScale(2), paid.setScale(2))
        }
    }
}
