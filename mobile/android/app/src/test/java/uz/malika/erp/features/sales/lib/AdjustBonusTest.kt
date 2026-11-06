package uz.malika.erp.features.sales.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** One case per failing key, plus two accepted inputs. */
class AdjustBonusTest {

    @Test
    fun emptyAmount() {
        assertEquals("customers.bonusErrAmountRequired", adjustBonusError("", "some reason"))
    }

    @Test
    fun badAmountFormat() {
        assertEquals("customers.bonusErrAmountFormat", adjustBonusError("abc", "some reason"))
        assertEquals("customers.bonusErrAmountFormat", adjustBonusError("12.345", "some reason"))
    }

    @Test
    fun zeroAmount() {
        assertEquals("customers.bonusErrAmountZero", adjustBonusError("0", "some reason"))
        assertEquals("customers.bonusErrAmountZero", adjustBonusError("0.00", "some reason"))
    }

    @Test
    fun blankReason() {
        assertEquals("customers.bonusErrReasonRequired", adjustBonusError("50", "   "))
    }

    @Test
    fun reasonTooLong() {
        assertEquals("customers.bonusErrReasonTooLong", adjustBonusError("50", "x".repeat(501)))
    }

    @Test
    fun negativeAmountAccepted() {
        assertNull(adjustBonusError("-50", "returned by mistake"))
    }

    @Test
    fun twoDecimalsAccepted() {
        assertNull(adjustBonusError("100.25", "correction"))
    }
}
