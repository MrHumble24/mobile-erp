package uz.malika.erp.features.sales

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.sales.data.CustomerBonus
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.features.sales.model.PosState
import java.math.BigDecimal

class PosStateTest {
    /** After a sale every switch survives and nothing of the old sale does. */
    @Test
    fun cleared_keeps_the_flags_and_drops_the_sale() {
        val used = PosState(
            level = "WHOLESALE",
            standingPercent = BigDecimal.TEN,
            canOverride = true, canUnlimited = true, canTradeIn = true,
            creditEnabled = true, shiftsEnabled = true, bonusEnabled = true,
            defaultWarrantyDays = 30, pendingSold = setOf("356938035643809"),
            customerBonus = CustomerBonus("c1", BigDecimal("5000"), BigDecimal("50")),
            bonusRequested = BigDecimal("100"),
            errorKey = "common.error", busy = true,
        )
        val next = used.cleared()
        assertTrue(next.canOverride && next.canUnlimited && next.canTradeIn)
        assertTrue(next.creditEnabled && next.shiftsEnabled && next.bonusEnabled)
        assertEquals(30, next.defaultWarrantyDays)
        assertEquals(setOf("356938035643809"), next.pendingSold)
        assertEquals(PriceLevel.DEFAULT, next.level)
        assertEquals(0, next.standingPercent.signum())
        assertNull(next.customerBonus)
        assertEquals(0, next.bonusRequested.signum())
        assertNull(next.errorKey)
        assertTrue(!next.busy && next.lines.isEmpty() && next.tradeIns.isEmpty())
    }
}
