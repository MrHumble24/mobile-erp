package uz.malika.erp.shared.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ImeiTextTest {
    @Test fun plain() = assertEquals("490154203237518", ImeiText.find("IMEI: 490154203237518"))

    @Test fun grouped() = assertEquals("490154203237518", ImeiText.find("IMEI1 49-015420-323751-8"))

    @Test fun spaced() = assertEquals("490154203237518", ImeiText.find("49 015420 323751 8 / 01"))

    @Test fun badCheckDigit() = assertNull(ImeiText.find("490154203237519"))

    @Test fun shortNumber() = assertNull(ImeiText.find("Model A2890 128GB"))
}
