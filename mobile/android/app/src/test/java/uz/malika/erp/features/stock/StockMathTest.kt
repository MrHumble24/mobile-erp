package uz.malika.erp.features.stock

import org.junit.Assert.assertEquals
import org.junit.Test
import uz.malika.erp.features.stock.data.StockMath

/** The count-correction difference shown before saving (ADR 0030). */
class StockMathTest {

    @Test
    fun countDifferenceIsCountedMinusCurrent() {
        // Counting more on the shelf than the system has → a positive correction.
        assertEquals(5, StockMath.countDifference(current = 10, counted = 15))
        // Counting fewer → a negative correction (pieces written down).
        assertEquals(-4, StockMath.countDifference(current = 10, counted = 6))
        // No change → zero (the server writes nothing).
        assertEquals(0, StockMath.countDifference(current = 7, counted = 7))
        // Correcting an oversold (below-zero) level back up to a real count.
        assertEquals(12, StockMath.countDifference(current = -2, counted = 10))
    }
}
