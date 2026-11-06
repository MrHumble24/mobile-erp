package uz.malika.erp.features.purchases

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import uz.malika.erp.features.purchases.lib.buyErrorKey

/** Buy-a-phone failure keys (ADR 0044): not-sold refusal, other 409, else null. */
class BuyErrorTest {

    @Test
    fun unitExistsGetsNotSold() {
        assertEquals("purchases.buyNotSold", buyErrorKey(409, "PURCHASE_UNIT_EXISTS"))
    }

    @Test
    fun conflictWithoutCodeIsBuyConflict() {
        assertEquals("purchases.buyConflict", buyErrorKey(409, null))
    }

    @Test
    fun badRequestIsNull() {
        assertNull(buyErrorKey(400, "PURCHASE_UNIT_EXISTS"))
    }
}
