package uz.malika.erp.features.sales.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** Server return refusals (ADR 0044): mapped codes → keys, everything else null. */
class ReturnErrorTest {

    @Test
    fun boughtBackMapsToItsKey() {
        assertEquals("sales.returnBoughtBack", returnErrorKey("SALE_UNIT_BOUGHT_BACK"))
    }

    @Test
    fun tradeInRefundMapsToItsKey() {
        assertEquals("sales.returnTradeInForbidden", returnErrorKey("TRADE_IN_REFUND_FORBIDDEN"))
    }

    @Test
    fun unknownCodeIsNull() {
        assertNull(returnErrorKey("BONUS_DISABLED"))
    }

    @Test
    fun nullCodeIsNull() {
        assertNull(returnErrorKey(null))
    }
}
