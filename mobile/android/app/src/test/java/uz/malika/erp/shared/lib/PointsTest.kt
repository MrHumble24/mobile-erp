package uz.malika.erp.shared.lib

import org.junit.Assert.assertEquals
import org.junit.Test

/** Groups thousands like [formatMoney], drops `.00`, keeps other decimals, null/junk → `0`. */
class PointsTest {

    @Test
    fun groupsThousandsAndDropsTrailingZeros() {
        assertEquals("1,450", formatPoints("1450.00"))
    }

    @Test
    fun keepsOtherDecimals() {
        assertEquals("12.5", formatPoints("12.50"))
    }

    @Test
    fun negativeDropsTrailingZeros() {
        assertEquals("-300", formatPoints("-300.00"))
    }

    @Test
    fun nullOrJunkIsZero() {
        assertEquals("0", formatPoints(null))
        assertEquals("0", formatPoints("not-a-number"))
    }
}
