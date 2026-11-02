package uz.malika.erp.features.finance

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.finance.model.bucketForRange
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.OTHER_KEY
import uz.malika.erp.features.finance.ui.components.capWithOther

class ReportChartMathTest {

    private fun row(i: Int, value: Double) = BreakdownDatum("k$i", "L$i", value, value / 100.0)

    @Test
    fun `short list is returned unchanged`() {
        val rows = listOf(row(1, 50.0), row(2, 30.0))
        assertEquals(rows, capWithOther(rows, limit = 10, otherLabel = "Other"))
    }

    @Test
    fun `overflow folds the tail into one others row summing value and share`() {
        val rows = (1..5).map { row(it, 10.0) } // 5 rows, each value 10, share 0.1
        val capped = capWithOther(rows, limit = 3, otherLabel = "Other")

        assertEquals(3, capped.size)
        val other = capped.last()
        assertEquals(OTHER_KEY, other.key)
        assertEquals("Other", other.label)
        // rows 3,4,5 fold in: value 30, share 0.3
        assertEquals(30.0, other.value, 1e-9)
        assertEquals(0.3, other.share, 1e-9)
        // the kept head rows are the top two originals
        assertEquals(listOf("k1", "k2"), capped.take(2).map { it.key })
    }

    @Test
    fun `trend bucket widens with the range`() {
        val day = 86_400_000L
        val from = 0L
        assertEquals("day", bucketForRange(from, from + 10 * day))
        assertEquals("week", bucketForRange(from, from + 60 * day))
        assertEquals("month", bucketForRange(from, from + 300 * day))
        assertTrue(bucketForRange(null, null) == "day")
    }
}
