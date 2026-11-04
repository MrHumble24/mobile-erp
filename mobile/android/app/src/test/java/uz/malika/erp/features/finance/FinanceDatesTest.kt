package uz.malika.erp.features.finance

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.finance.model.endOfDay
import uz.malika.erp.features.finance.model.isoInstant
import uz.malika.erp.features.finance.model.isoRangeFrom
import uz.malika.erp.features.finance.model.isoRangeTo
import uz.malika.erp.features.finance.model.startOfDay
import java.util.Date

/** A one-day range must span the whole local day, never collapse to one instant. */
class FinanceDatesTest {
    private val noon = Date(1_762_250_400_000L) // 2025-11-04 10:00:00Z

    @Test
    fun `range bounds cover the whole local day`() {
        val from = startOfDay(noon)
        val to = endOfDay(noon)
        assertEquals(86_400_000L - 1, to.time - from.time)
        assertTrue(from.time <= noon.time && noon.time <= to.time)
    }

    @Test
    fun `range params are ISO instants, not bare dates`() {
        val from = isoRangeFrom(noon.time)!!
        val to = isoRangeTo(noon.time)!!
        assertTrue(from.endsWith("Z") && from.contains('T'))
        assertTrue(to.endsWith(".999Z"))
        assertTrue(from < to)
        assertEquals("2025-11-04T10:00:00.000Z", isoInstant(noon))
    }
}
