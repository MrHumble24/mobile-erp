package uz.malika.erp.shared.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The IMEI-or-serial decision and serial normalisation (ADR 0029). */
class UnitCodeTest {
    // Luhn-valid 15-digit IMEI.
    private val imei = "490154203237518"

    @Test fun identifyRoutesAValidImeiToImei() {
        val id = UnitCode.identify(" $imei ")
        assertEquals(imei, id.imei)
        assertNull(id.serialNumber)
    }

    @Test fun identifyRoutesAnythingElseToSerial() {
        val id = UnitCode.identify("ps5-xyz") // not 15 digits → serial
        assertNull(id.imei)
        assertEquals("PS5-XYZ", id.serialNumber)
    }

    @Test fun identifyRoutesAShortNumberToSerial() {
        // A barcode that is not a full IMEI is a serial, never a partial imei.
        assertEquals("12345", UnitCode.identify("12345").serialNumber)
    }

    @Test fun normaliseTrimsAndUppercases() =
        assertEquals("SW52MM", UnitCode.normalizeSerial("  sw52mm  "))

    @Test fun validSerialBounds() {
        assertTrue(UnitCode.isValidSerial("abc"))
        assertTrue(UnitCode.isValidSerial("SW123456789"))
        assertFalse(UnitCode.isValidSerial("ab")) // < 3
        assertFalse(UnitCode.isValidSerial("has space"))
        assertFalse(UnitCode.isValidSerial("has-dash"))
        assertFalse(UnitCode.isValidSerial("A".repeat(65))) // > 64
    }

    @Test fun displayPrefersImeiThenSerial() {
        assertEquals(imei, UnitCode.display(imei, "SN1"))
        assertEquals("SN1", UnitCode.display(null, "SN1"))
        assertEquals("", UnitCode.display(null, null))
    }
}
