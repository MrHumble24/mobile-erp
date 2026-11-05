package uz.malika.erp.features.procurement

import org.junit.Assert.assertEquals
import org.junit.Test
import uz.malika.erp.features.procurement.lib.LookupFill

/** Intake autofill fills only empty storage/colour, never overwriting typed values (ADR 0031). */
class LookupFillTest {

    @Test
    fun fillsEmptyStorageAndColour() {
        val out = LookupFill.fill(emptyMap(), storage = "128 GB", color = "Black")
        assertEquals("128 GB", out["storage"])
        assertEquals("Black", out["color"])
    }

    @Test
    fun neverOverwritesWhatThePersonTyped() {
        val typed = mapOf("storage" to "256 GB", "color" to "")
        val out = LookupFill.fill(typed, storage = "128 GB", color = "Blue")
        assertEquals("256 GB", out["storage"]) // kept — the person already typed it
        assertEquals("Blue", out["color"]) // colour was blank → filled
    }

    @Test
    fun nullOptionsLeaveSpecsUnchanged() {
        val typed = mapOf("storage" to "512 GB")
        val out = LookupFill.fill(typed, storage = null, color = null)
        assertEquals(typed, out)
    }

    @Test
    fun blankOptionsAreIgnored() {
        val out = LookupFill.fill(mapOf("color" to "Red"), storage = "  ", color = "")
        assertEquals(null, out["storage"])
        assertEquals("Red", out["color"])
    }
}
