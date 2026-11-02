package uz.malika.erp.features.nasiya

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.nasiya.model.creditUsedFraction
import uz.malika.erp.features.nasiya.model.daysOverdue
import uz.malika.erp.features.nasiya.model.isValidImei
import uz.malika.erp.features.nasiya.model.isoDateMillis

/** Pure Nasiya logic: overdue aging, IMEI rule, credit-bar ratio. */
class NasiyaLogicTest {

    private val jan11 = isoDateMillis("2026-01-11T00:00:00.000Z")!!

    @Test
    fun overdueOnlyForOutAndPastDue() {
        assertEquals(10, daysOverdue("2026-01-01T00:00:00.000Z", "OUT", jan11))
        assertEquals(0, daysOverdue("2026-02-01T00:00:00.000Z", "OUT", jan11)) // not yet due
        assertEquals(0, daysOverdue("2026-01-01T00:00:00.000Z", "SETTLED", jan11)) // resolved
    }

    @Test
    fun imeiIsExactlyFifteenDigits() {
        assertTrue(isValidImei("123456789012345"))
        assertFalse(isValidImei("12345"))
        assertFalse(isValidImei("12345678901234a"))
        assertFalse(isValidImei("1234567890123456"))
    }

    @Test
    fun creditFractionClampsAndHandlesUnlimited() {
        assertEquals(0.7f, creditUsedFraction("1000", "700"))
        assertEquals(1.0f, creditUsedFraction("1000", "4000")) // clamped
        assertNull(creditUsedFraction("0", "500")) // no limit
    }
}
