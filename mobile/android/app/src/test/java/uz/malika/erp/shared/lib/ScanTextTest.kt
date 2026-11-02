package uz.malika.erp.shared.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ScanTextTest {
    @Test fun imeiPlain() = assertEquals("490154203237518", ScanText.imei("IMEI: 490154203237518"))

    @Test fun imeiGrouped() = assertEquals("490154203237518", ScanText.imei("IMEI1 49-015420-323751-8"))

    @Test fun imeiSpaced() = assertEquals("490154203237518", ScanText.imei("49 015420 323751 8 / 01"))

    @Test fun imeiBadCheckDigit() = assertNull(ScanText.imei("490154203237519"))

    @Test fun imeiShortNumber() = assertNull(ScanText.imei("Model A2890 128GB"))

    @Test fun numbersSkipShortAndRepeats() =
        assertEquals(listOf("2890", "1200000"), ScanText.numbers("A2890 128GB 1-200-000 so'm A2890"))
}
