package uz.malika.erp.features.finance

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import uz.malika.erp.features.finance.data.ModelPricingRow
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.model.DashPeriod
import uz.malika.erp.features.finance.model.periodStart
import java.util.Calendar
import java.util.Date

/**
 * Pure finance logic on the JVM: the flexible money decode (server sends money
 * as a JSON number OR a Decimal string; cost fields may be absent/null) and the
 * dashboard period-start date math.
 */
class FinanceTest {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    @Test
    fun decodesMoneyFromNumberOrString() {
        val p = json.decodeFromString(
            ProfitReport.serializer(),
            """{"revenue": 1250.5, "cogs": "800.00", "unitsSold": 3}""",
        )
        assertEquals("1250.5", p.revenue) // JSON number
        assertEquals("800.00", p.cogs)    // Decimal string
        assertEquals(3, p.unitsSold)
        assertEquals("0", p.grossProfit)  // absent → default
    }

    @Test
    fun costFieldsAreNullWhenAbsentOrNull() {
        val present = json.decodeFromString(
            ModelPricingRow.serializer(),
            """{"modelId":"m1","avgAcquisitionCost":500,"avgSellingPrice":null,"unitsInStock":2}""",
        )
        assertEquals("500", present.avgAcquisitionCost)
        assertNull(present.avgSellingPrice)       // explicit null
        val redacted = json.decodeFromString(
            ModelPricingRow.serializer(),
            """{"modelId":"m2","unitsInStock":0}""",
        )
        assertNull(redacted.avgAcquisitionCost)   // absent (redacted)
    }

    @Test
    fun periodStartSnapsToDayWeekMonth() {
        // Wednesday 2026-03-18 14:30.
        val now = Calendar.getInstance().apply {
            set(2026, Calendar.MARCH, 18, 14, 30, 0); set(Calendar.MILLISECOND, 0)
        }.time

        assertEquals("2026-03-18 00:00", fmt(periodStart(DashPeriod.TODAY, now)))
        assertEquals("2026-03-16 00:00", fmt(periodStart(DashPeriod.WEEK, now))) // Monday
        assertEquals("2026-03-01 00:00", fmt(periodStart(DashPeriod.MONTH, now)))
    }

    private fun fmt(d: Date): String {
        val c = Calendar.getInstance().apply { time = d }
        return "%04d-%02d-%02d %02d:%02d".format(
            c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH),
            c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE),
        )
    }
}
